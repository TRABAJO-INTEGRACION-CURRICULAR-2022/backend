const EnterpriseCtrl = {};
const EnterpriseModel = require('../model/Enterprise.model');
const EmailModel = require('../model/Email.model')
const UserModal = require("../model/User.model")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BlockchainModal = require('../model/Blockchain.modal');
const ConsentModel = require('../model/Consent.model');
const TreatmentModel = require('../model/Treatment.model');
var XLSX = require('xlsx');

var aspose = aspose || {};
aspose.cells = require("aspose.cells");
const fs = require('fs');
//var aspose = aspose || {};
//aspose.cells = require("aspose.cells");








//Para crear una empresa
EnterpriseCtrl.createEnterprise = async (req, res) => {
    let { name, email, ruc, password } = req.body

    const emailUser = await EnterpriseModel.findOne({ email: email })

    if (emailUser) {
        res.json({
            status: 'El correo ya existe o inválido'
        })
    }
    else {


        try {

            if (name && email && ruc && password) {
                //Encriptar la contraseña y un token para la validacion
                password = await bcrypt.hash(password, 10)


                const NewEnterprise = new EnterpriseModel({
                    name,
                    email,
                    ruc,
                    password
                })

                await NewEnterprise.save();

                res.json({
                    status: "Empresa Guardada"
                })

            } else {
                res.json({
                    status: "Llene todos los campos"
                })
            }

        } catch (error) {
            console.log(error)

            res.json({
                status: "Error al guardar al empresa"
            })

        }
    }


};

//Obtener empresa por id

EnterpriseCtrl.getEnterpriseById = async (req, res) => {

    let id = req.params.id

    let enterprise = await EnterpriseModel.findById(id)

    if (enterprise) {

        res.status(200).send({
            status: true,
            enterprise: enterprise
        })

    } else {
        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    }
}

//Actualizar una empresa
EnterpriseCtrl.updateEnterprise = async (req, res) => {
    let { name, email, ruc, password } = req.body

    const empresa = await EnterpriseModel.findById(req.params.id);

    if (empresa) {
        const email2 = await EnterpriseModel.findOne({ email: email });
        if (!email2) {

            try {



                const nuevoEmpresa = {
                    name,
                    email,
                    ruc,
                    password
                };


                await EnterpriseModel.findByIdAndUpdate(req.params.id, nuevoEmpresa, { userFindAndModify: false });
                res.json({
                    status: 'Empresa Actualizada'
                });






            } catch (error) {
                console.log(error)

                res.json({
                    status: 'Error al actualizar el usuario'
                });

            }



        } else {
            res.json({
                status: "El email ya existe"
            })
        }

    }
};

//Enviar email a un usuario
EnterpriseCtrl.sendEmail = async (req, res) => {

    let { email, descripcionConsentimeinto, permisos, data, fechaFin, observaciones } = req.body;

    //console.log(permisos)
    var idEmpresa = req.params.id

    let empresa = await EnterpriseModel.findById(idEmpresa)

    if (empresa) {
        let usuario = await UserModal.findOne({ email: email })


        if (usuario) {

            let date = new Date();

            let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

            let consent = await ConsentModel.findOne({ "empresa.id": idEmpresa, "usuario.id": usuario._id })

            if (consent) {

                res.status(400).send({
                    status: true,
                    message: "Ya existe un consentimeinto aceptado, tendrás que eliminar el anterior si deseas crear unno nuevo"
                })

            } else {

                try {

                    let idUsuario = usuario._id

                    const NewEmail = new EmailModel({
                        empresa: {
                            id: empresa._id,
                            name: empresa.name
                        },
                        usuario: {
                            id: usuario._id,
                            name: usuario.name
                        },
                        idUsuario: idUsuario,
                        data: data,
                        descripcionConcentimiento: descripcionConsentimeinto,
                        permisos: permisos,
                        fechaFin: fechaFin,
                        obsevaciones: observaciones,
                        fechaEnvio: strTime



                    })

                    await NewEmail.save()

                    res.json({
                        status: "Email Enviado"
                    })

                } catch (error) {
                    console.log(error)

                    res.json({
                        status: "Error al envíar correo"
                    })

                }
            }

        } else {
            res.json({
                status: "No existe el usuario"
            })
        }

    } else {
        res.json({
            status: "No existe la empresa"
        })
    }
}


//Coger solo los emails respondidos y los permisos
/*
EnterpriseCtrl.getUsers = async (req, res) => {

    console.log(req.params.id)

    let users = await ConsentModel.find({ "empresa.id": req.params.id, activo: true })

    if (users.length > 0) {

        res.send(users)

    } else {
        res.send({
            status: "No existen consentimeintos"
        })
    }



}
*/
//Login

EnterpriseCtrl.login = async (req, res) => {

    const { email, password } = req.body

    const enterprise = await EnterpriseModel.findOne({ email: email })

    const passwordCorrect = enterprise === null
        ? false
        : await bcrypt.compare(password, enterprise.password)

    if (!(enterprise && passwordCorrect)) {
        return res.status(401).json({
            error: 'correo o contraseña invalida'
        })
    }

    const enterpriseForToken = {
        email: enterprise.email,
        id: enterprise._id,
        name: enterprise.name
    }

    const token = jwt.sign(enterpriseForToken, "secreto")

    res
        .status(200)
        .send({ token, enterprise })

}

//Obtener usuario

EnterpriseCtrl.getUserConsent = async (req, res) => {

    let id = req.params.id

    let consent = await ConsentModel.findById(id)


    if (consent) {
        res.status(200).send({
            status: true,
            consent: consent,
            message: "ok"
        })
    } else {
        res.status(404).send({
            status: false,
            message: "No existe el consentimiento"
        })
    }

}

//Obtener usuarios con consentimiento

EnterpriseCtrl.getUsers = async (req, res) => {

    let id = req.params.id

    let enterprise = await EnterpriseModel.findById(id)

    if (enterprise) {
        let usersSend = []
        let users = await ConsentModel.find({ "empresa.id": id})

        for (var i = 0; i < users.length; i++) {

            let user = await UserModal.findById(users[i].usuario.id)
            
            usersSend[i] = {
                id_consent: users[i]._id,
                id_user: user._id,
                fechaFinConsentimeinto: users[i].fechaFinConsentimeinto,
                name: user.name,
                lastname: user.lastName
            }
        }

        if (users.length > 0) {
            res.send(usersSend)
        } else {
            res.send({
                status: "No hay usuarios"
            })
        }

    } else {
        res.send({
            status: "No existe la empresa"
        })
    }




}


//Crear tratamiento

EnterpriseCtrl.createTreatment = async (req, res) => {

    let id = req.params.id

    let enterprise = await EnterpriseModel.findById(id)

    if (enterprise) {



        let { name, data, description } = req.body

        let treatment = await TreatmentModel.findOne({ name: name })

        console.log(data)

        if (treatment) {
            res.status(400).send({
                status: false,
                message: "Ya existe el tratamiento"
            })
        } else {

            const NewData = new TreatmentModel({
                name: name,
                data: data,
                enterpriseId: id,
                description: description

            })

            await NewData.save();

            res.status(200).send({
                status: true,
                message: "Tratamiento creado"
            })
        }
    } else {

        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    }

}


//Actualziar tratamiento

EnterpriseCtrl.updateTreatment = async (req, res) => {


    let id = req.params.id

    let treatment = await TreatmentModel.findById(id)


    if (treatment) {

        let { name, data } = req.body

        const newTreeatment = {
            name,
            data,
        };


        if (name === treatment.name) {

            await TreatmentModel.findByIdAndUpdate(req.params.id, newTreeatment);
            res.status(200).send({
                status: true,
                message: 'Tratamiento Actualizado'
            });

        } else if (!treatment) {

            await TreatmentModel.findByIdAndUpdate(req.params.id, newTreeatment);
            res.status(200).send({
                status: true,
                message: 'Tratamiento Actualizado'
            });

        } else {

            res.status(400).send({
                status: false,
                message: 'El nombre del tratamiento ya existe'
            });

        }





    } else {
        res.status(400).send({
            status: false,
            message: "No existe el tratamiento"
        })
    }
}

//Obtener tratamientos

EnterpriseCtrl.getTreatments = async (req, res) => {

    let id = req.params.id

    let enterprise = await EnterpriseModel.findById(id)

    if (enterprise) {

        let treatments = await TreatmentModel.find({ enterpriseId: id })

        res.status(200).send({
            status: true,
            treatments: treatments
        })


    } else {

        res.status(400).send({
            status: false,
            message: "No existe la empresa"

        })

    }

}


//Obtener tratamiento

EnterpriseCtrl.getTreatment = async (req, res) => {

    let id = req.params.id

    let treatment = await TreatmentModel.findById(id)

    if (treatment) {

        res.status(200).send({
            status: true,
            treatment: treatment
        })

    } else {
        res.status(400).send({
            status: false,
            message: "No existe el tratamiento"
        })
    }
}



//Exportar historial de usuario

EnterpriseCtrl.exportDatabyUser = async (req, res) => {

    let enterpriseId = req.params.enterpriseId
    let userId = req.params.userId
    let type = req.params.type

    let enterprise = await EnterpriseModel.findById(enterpriseId)

    if (!enterprise) {
        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    } else {

        let user = await UserModal.findById(userId)

        if (!user) {
            res.status(400).send({
                status: false,
                message: "No existe el usuario"
            })
        } else {


            let consents = await ConsentModel.find({ "usuario.id": userId, "empresa.id": enterpriseId, activo: true })

            let send_1 = []



            let arrayPermisos = []


            let arrayPermisosAux = []

            let arrayPermisosAux2 = []

            let dataPermisos =[]




            let send = []

            let contador = 0

            let contador2 = 0

            let permiso;

            let nombrePermiso = []

            let send_3 = []

            let consenToJason = []

            for(var i = 0; i < consents.length; i++){

                const empresa = await EnterpriseModel.findById(consents[i].empresa.id)
                consenToJason[i] = {
                    nameEmpresa: empresa.nombreEmpresa,
                    emailEmpresa: empresa.email,
                    data: consents[i].data,
                    permisos: consents[i].permisos,
                    fechaFinConsentimeinto: consents[i].fechaFinConsentimeinto

                }
            }


            for (var i = 0; i < consents.length; i++) {

                

                
                
                let consent = consents[i]

                for (var j = 0; j < consent.data.length; j++) {



                    send[contador] = {
                        tipo: consent.data[j].tipo,
                        valor: consent.data[j].valor,
                        empresa: consent.empresa.name,

                    }

                    contador = contador + 1

                    

                }

                contador = 0

                //console.log("send + i",send, i)

                for (var k = 0; k < consent.permisos.length; k++) {

                    dataPermisos[k] = consent.permisos[k].data


                    permiso = consent.permisos[k].tipo

                    //nombrePermiso.push(permiso)


                    for (var l = 0; l < consent.data.length; l++) {



                        if (dataPermisos[k].includes(consent.data[l].tipo)) {


                            arrayPermisos.push(1)
                            nombrePermiso.push(permiso)

                        } else {
                            arrayPermisos.push(0)
                            nombrePermiso.push(permiso)
                        }

                        


                    }

                

                    arrayPermisosAux[contador2] = arrayPermisos
                    arrayPermisosAux2[contador2] = nombrePermiso

                    arrayPermisos = []
                    nombrePermiso = []
                    contador2 =  contador2+1



                }

                //console.log("hola",arrayPermisosAux2)

                for(var n = 0;n < arrayPermisosAux.length; n++){

                    send_1[n] = {
                        
                        send:send,
                        permisos: arrayPermisosAux[n],
                        tratamientos: arrayPermisosAux2[n]

                    }
    
                    
                }


                send = []
    
                contador2 = 0

                send_3[i] = {send_1}
                

                arrayPermisosAux =[]
                arrayPermisosAux2 = []

                send_1 =[]

            }




            let date = Date()
            let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

            const d = new Date(strTime);


            if (type === "xlsx") {




                var temp = JSON.stringify(send_3);

                var workbook = aspose.cells.Workbook()

                // access default empty worksheet
                var worksheet = workbook.getWorksheets().get(0)

                // set JsonLayoutOptions for formatting
                var layoutOptions = aspose.cells.JsonLayoutOptions()
                layoutOptions.setArrayAsTable(true)

                // import JSON data to default worksheet starting at cell A1
                aspose.cells.JsonUtility.importData(temp, worksheet.getCells(), 0, 0, layoutOptions)

                // save resultant file
                workbook.save("output.xlsx", aspose.cells.SaveFormat.AUTO)

                res.download("output.xlsx")


            } else if (type === "csv") {

                
                var temp = JSON.stringify(send_3);

                var workbook = aspose.cells.Workbook()

                // access default empty worksheet
                var worksheet = workbook.getWorksheets().get(0)

                // set JsonLayoutOptions for formatting
                var layoutOptions = aspose.cells.JsonLayoutOptions()
                layoutOptions.setArrayAsTable(true)

                // import JSON data to default worksheet starting at cell A1
                aspose.cells.JsonUtility.importData(temp, worksheet.getCells(), 0, 0, layoutOptions)

                // save resultant file
                workbook.save("output.csv", aspose.cells.SaveFormat.AUTO)

                res.download("output.csv")


            }else if(type === "json"){
                const fileName = "output.json"
                const heroeToJson = JSON.stringify(consenToJason)
                fs.writeFileSync(fileName, heroeToJson)

                res.download("output.json")
            } else {
                res.status(400).send({
                    status: true,
                    message: "No existe la extensión del archivo solicitada"
                })
            }

        }
    }

}

//Exportar historial por tratamiento

EnterpriseCtrl.exportDatabyTreatment = async (req, res) => {

    let enterpriseId = req.params.enterpriseId
    let treatment = req.params.treatment
    let type = req.params.type


    let enterprise = await EnterpriseModel.findById(enterpriseId)

    if (!enterprise) {
        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    } else {

        //db.users.find({awards: {$elemMatch: {award:'National Medal', year:1975}}})


        let consents = await ConsentModel.find({ "empresa.id": enterpriseId, permisos: { $elemMatch: { tipo: treatment } }})

        let date = Date()
        let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

        const d = new Date(strTime);

        let send_1 = []



        let arrayPermisos = []


        let arrayPermisosAux = []

        let arrayPermisosAux2 = []

        let dataPermisos =[]




        let send = []

        let contador = 0

        let contador2 = 0

        let permiso;

        let nombrePermiso = []

        let send_3 = []

        let consenToJason = []

        for(var i = 0; i < consents.length; i++){

            const empresa = await EnterpriseModel.findById(consents[i].empresa.id)
            consenToJason[i] = {
                nameEmpresa: empresa.nombreEmpresa,
                emailEmpresa: empresa.email,
                data: consents[i].data,
                permisos: consents[i].permisos,
                fechaFinConsentimeinto: consents[i].fechaFinConsentimeinto

            }
        }

        for (var i = 0; i < consents.length; i++) {

            

            
            
            let consent = consents[i]

            for (var j = 0; j < consent.data.length; j++) {



                send[contador] = {
                    tipo: consent.data[j].tipo,
                    valor: consent.data[j].valor,
                    empresa: consent.empresa.name,

                }

                contador = contador + 1

                

            }

            contador = 0

            //console.log("send + i",send, i)

            for (var k = 0; k < consent.permisos.length; k++) {

                dataPermisos[k] = consent.permisos[k].data


                permiso = consent.permisos[k].tipo

                //nombrePermiso.push(permiso)


                for (var l = 0; l < consent.data.length; l++) {



                    if (dataPermisos[k].includes(consent.data[l].tipo)) {


                        arrayPermisos.push(1)
                        nombrePermiso.push(permiso)

                    } else {
                        arrayPermisos.push(0)
                        nombrePermiso.push(permiso)
                    }

                    


                }

            

                arrayPermisosAux[contador2] = arrayPermisos
                arrayPermisosAux2[contador2] = nombrePermiso

                arrayPermisos = []
                nombrePermiso = []
                contador2 =  contador2+1



            }

            //console.log("hola",arrayPermisosAux2)

            for(var n = 0;n < arrayPermisosAux.length; n++){

                send_1[n] = {
                    
                    send:send,
                    permisos: arrayPermisosAux[n],
                    tratamientos: arrayPermisosAux2[n]

                }

                
            }


            send = []

            contador2 = 0

            send_3[i] = {send_1}
            

            arrayPermisosAux =[]
            arrayPermisosAux2 = []

            send_1 =[]

        }



        if (type === "xlsx") {

            var temp = JSON.stringify(send_3);

                var workbook = aspose.cells.Workbook()

                // access default empty worksheet
                var worksheet = workbook.getWorksheets().get(0)

                // set JsonLayoutOptions for formatting
                var layoutOptions = aspose.cells.JsonLayoutOptions()
                layoutOptions.setArrayAsTable(true)

                // import JSON data to default worksheet starting at cell A1
                aspose.cells.JsonUtility.importData(temp, worksheet.getCells(), 0, 0, layoutOptions)

                // save resultant file
                workbook.save("output.xlsx", aspose.cells.SaveFormat.AUTO)

                res.download("output.xlsx")


        } else if (type === "csv") {

            var temp = JSON.stringify(send_3);

                var workbook = aspose.cells.Workbook()

                // access default empty worksheet
                var worksheet = workbook.getWorksheets().get(0)

                // set JsonLayoutOptions for formatting
                var layoutOptions = aspose.cells.JsonLayoutOptions()
                layoutOptions.setArrayAsTable(true)

                // import JSON data to default worksheet starting at cell A1
                aspose.cells.JsonUtility.importData(temp, worksheet.getCells(), 0, 0, layoutOptions)

                // save resultant file
                workbook.save("output.csv", aspose.cells.SaveFormat.AUTO)

                res.download("output.csv")


        } else if(type === "json"){
            const fileName = "output.json"
            const heroeToJson = JSON.stringify(consenToJason)
            fs.writeFileSync(fileName, heroeToJson)

            res.download("output.json")
        }else {
            res.status(400).send({
                status: true,
                message: "No existe la extensión del archivo solicitada"
            })
        }

    }



}

//Exportar toda data empresa

EnterpriseCtrl.exportAllEnterprise = async (req, res) => {

    let enterpriseId = req.params.enterpriseId
    let type = req.params.type


    let enterprise = await EnterpriseModel.findById(enterpriseId)

    if (!enterprise) {
        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    } else {

        let date = Date()
        let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

        const d = new Date(strTime);
        let consents = await ConsentModel.find({ "empresa.id": enterpriseId, activo: true })


        
        let send_1 = []



            let arrayPermisos = []


            let arrayPermisosAux = []

            let arrayPermisosAux2 = []

            let dataPermisos =[]




            let send = []

            let contador = 0

            let contador2 = 0

            let permiso;

            let nombrePermiso = []

            let send_3 = []

            let consenToJason = []

            for(var i = 0; i < consents.length; i++){

                const empresa = await EnterpriseModel.findById(consents[i].empresa.id)
                consenToJason[i] = {
                    nameEmpresa: empresa.nombreEmpresa,
                    emailEmpresa: empresa.email,
                    data: consents[i].data,
                    permisos: consents[i].permisos,
                    fechaFinConsentimeinto: consents[i].fechaFinConsentimeinto

                }
            }

            for (var i = 0; i < consents.length; i++) {

                

                
                
                let consent = consents[i]

                for (var j = 0; j < consent.data.length; j++) {



                    send[contador] = {
                        tipo: consent.data[j].tipo,
                        valor: consent.data[j].valor,
                        empresa: consent.empresa.name,

                    }

                    contador = contador + 1

                    

                }

                contador = 0

                //console.log("send + i",send, i)

                for (var k = 0; k < consent.permisos.length; k++) {

                    dataPermisos[k] = consent.permisos[k].data


                    permiso = consent.permisos[k].tipo

                    //nombrePermiso.push(permiso)


                    for (var l = 0; l < consent.data.length; l++) {



                        if (dataPermisos[k].includes(consent.data[l].tipo)) {


                            arrayPermisos.push(1)
                            nombrePermiso.push(permiso)

                        } else {
                            arrayPermisos.push(0)
                            nombrePermiso.push(permiso)
                        }

                        


                    }

                

                    arrayPermisosAux[contador2] = arrayPermisos
                    arrayPermisosAux2[contador2] = nombrePermiso

                    arrayPermisos = []
                    nombrePermiso = []
                    contador2 =  contador2+1



                }

                //console.log("hola",arrayPermisosAux2)

                for(var n = 0;n < arrayPermisosAux.length; n++){

                    send_1[n] = {
                        
                        send:send,
                        permisos: arrayPermisosAux[n],
                        tratamientos: arrayPermisosAux2[n]

                    }
    
                    
                }


                send = []
    
                contador2 = 0

                send_3[i] = {send_1}
                

                arrayPermisosAux =[]
                arrayPermisosAux2 = []

                send_1 =[]

            }


            
    









        if (consents.length > 0) {



            if(type === "xlsx"){


             
                

                var temp = JSON.stringify(send_3);

                var workbook = aspose.cells.Workbook()

                // access default empty worksheet
                var worksheet = workbook.getWorksheets().get(0)

                // set JsonLayoutOptions for formatting
                var layoutOptions = aspose.cells.JsonLayoutOptions()
                layoutOptions.setArrayAsTable(true)

                // import JSON data to default worksheet starting at cell A1
                aspose.cells.JsonUtility.importData(temp, worksheet.getCells(), 0, 0, layoutOptions)

                // save resultant file
                workbook.save("output.xlsx", aspose.cells.SaveFormat.AUTO)

                res.download("output.xlsx")




            } else if (type === "csv") {
                var temp = JSON.stringify(send_3);

                var workbook = aspose.cells.Workbook()

                // access default empty worksheet
                var worksheet = workbook.getWorksheets().get(0)

                // set JsonLayoutOptions for formatting
                var layoutOptions = aspose.cells.JsonLayoutOptions()
                layoutOptions.setArrayAsTable(true)

                // import JSON data to default worksheet starting at cell A1
                aspose.cells.JsonUtility.importData(temp, worksheet.getCells(), 0, 0, layoutOptions)

                // save resultant file
                workbook.save("output.csv", aspose.cells.SaveFormat.AUTO)

                res.download("output.csv")

            } else if(type==="json"){

           

                const fileName = "output.json"
                const heroeToJson = JSON.stringify(consenToJason)
                fs.writeFileSync(fileName, heroeToJson)

                res.download("output.json")


            }else {
                res.status(400).send({
                    status: true,
                    message: "No existe la extensión del archivo solicitada"
                })
            }
        } else {
            res.status(400).send({
                status: true,
                message: "No existen usuarios"
            })
        }

       
    }

}

//Filtro  por tratamiento

EnterpriseCtrl.getUsersByTreatment = async (req, res) => {

    let enterpriseId = req.params.enterpriseId
    let treatment = req.params.treatment


    let enterprise = await EnterpriseModel.findById(enterpriseId)

    if (!enterprise) {
        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    } else {
        let consents = await ConsentModel.find({ "empresa.id": enterpriseId, permisos: { $elemMatch: { tipo: treatment } } })


        if (consents.length > 0) {
            usersSend = []

            for (var i = 0; i < consents.length; i++) {


                let user = await UserModal.findById(consents[i].usuario.id)
                usersSend[i] = {
                    id_consent: consents[i]._id,
                    id_user: user._id,
                    fechaFinConsentimeinto: consents[i].fechaFinConsentimeinto,
                    name: user.name,
                    lastname: user.lastName,
                    permisos: consents[i].permisos
                }
            }

            res.status(200).send({
                status: true,
                consents: usersSend
            })
        } else {
            res.status(400).send({
                status: false,
                message: "No existen usuarios"
            })
        }

    }


}



//Obtener blockchain


EnterpriseCtrl.getBlockChain = async (req, res) => {
    let enterpriseId = req.params.enterpriseId
    let userId = req.params.userId

    let enterprise = await EnterpriseModel.findById(enterpriseId)

    let user = await UserModal.findById(userId)

    if (!enterprise) {

        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })

    } else {

        if (!user) {

            res.status(400).send({
                status: false,
                message: "No existe el usuario"
            })


        } else {

            let blockchain = await BlockchainModal.find({ enterpriseId: enterpriseId, userId: userId })

          


            if (blockchain.length > 0) {


               

                console.log("holi", blockchain)

                res.status(200).send({
                    status: true,
                    blockchain: blockchain
                })
            } else {
                res.status(400).send({
                    status: false,
                    message: "No existe cadena"
                })

            }
        }
    }
}


//Obtener correos no respondidos

EnterpriseCtrl.getEmailsDoesntAnswered = async (req, res) => {

    let id = req.params.id

    let enterprise = await EnterpriseModel.findById(id)

    if (enterprise) {

        let emails = await EmailModel.find({ "empresa.id": id, respondido: false })



        if (emails.length > 0) {

            res.status(200).send({
                status: true,
                emails: emails
            })
        } else {
            res.status(400).send({
                status: false,
                message: "No hay emails"
            })
        }

    } else {
        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })
    }

}









module.exports = EnterpriseCtrl;