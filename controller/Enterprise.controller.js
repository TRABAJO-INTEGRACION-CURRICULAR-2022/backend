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
const fs = require("fs")








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

    console.log(permisos)
    var idEmpresa = req.params.id

    let empresa = await EnterpriseModel.findById(idEmpresa)

    if (empresa) {
        let usuario = await UserModal.findOne({ email: email })


        if (usuario) {

            let date = new Date();

            let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

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

EnterpriseCtrl.getUsers = async (req, res) => {

    console.log(req.params.id)

    let users = await ConsentModel.find({ "empresa.id": req.params.id })

    if (users.length > 0) {

        res.send(users)

    } else {
        res.send({
            status: "No existen consentimeintos"
        })
    }



}

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
        let users = await ConsentModel.find({ "empresa.id": id })

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


//Descargar historial de usuario

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
    }

    let user = await UserModal.findById(userId)

    if (!user) {
        res.status(400).send({
            status: false,
            message: "No existe el usuario"
        })
    }


    let blockchain = await BlockchainModal.find({ userId: userId, enterpriseId: enterpriseId })
    let date = Date()
    let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

    const d = new Date(strTime);


    if (type === "xlsx") {



        var wb = XLSX.utils.book_new(); //new workbook
        var temp = JSON.stringify(blockchain);
        temp = JSON.parse(temp);
        var ws = XLSX.utils.json_to_sheet(temp);
        var down = __dirname + `/public/${d.getDay()}-exportdataUser.xlsx`
        XLSX.utils.book_append_sheet(wb, ws, "sheet1");
        XLSX.writeFile(wb, down);
        res.download(down);
        //fs.unlink(__dirname + `/public/${d.getDay()}-exportdata.xlsx`)
    } else if (type === "csv") {

        var wb = XLSX.utils.book_new(); //new workbook
        var temp = JSON.stringify(blockchain);
        temp = JSON.parse(temp);
        var ws = XLSX.utils.json_to_sheet(temp);
        var down = __dirname + `/public/${d.getDay()}-exportdata.csv`
        XLSX.utils.book_append_sheet(wb, ws, "sheet1");
        XLSX.writeFile(wb, down);

        res.download(down);


    } else {
        res.status(400).send({
            status: true,
            message: "No existe la extensión del archivo solicitada"
        })
    }




}

//Descargar historial por tratamiento

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


        let blockchain = await BlockchainModal.find({ enterpriseId: enterpriseId, permisos: { $elemMatch: { tipo: treatment } } })

        let date = Date()
        let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

        const d = new Date(strTime);

        if (type === "xlsx") {



            var wb = XLSX.utils.book_new(); //new workbook
            var temp = JSON.stringify(blockchain);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname + `/public/${d.getDay()}-exportdataTreatment.xlsx`
            XLSX.utils.book_append_sheet(wb, ws, "sheet1");
            XLSX.writeFile(wb, down);
            res.download(down);
            //fs.unlink(__dirname + `/public/${d.getDay()}-exportdata.xlsx`)
        } else if (type === "csv") {

            var wb = XLSX.utils.book_new(); //new workbook
            var temp = JSON.stringify(blockchain);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname + `/public/${d.getDay()}-exportdata.csv`
            XLSX.utils.book_append_sheet(wb, ws, "sheet1");
            XLSX.writeFile(wb, down);

            res.download(down);


        } else {
            res.status(400).send({
                status: true,
                message: "No existe la extensión del archivo solicitada"
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
        let blockchain = await BlockchainModal.find({ enterpriseId: enterpriseId })


        if(blockchain.length > 0){


        if (type === "xlsx") {



            var wb = XLSX.utils.book_new(); //new workbook
            var temp = JSON.stringify(blockchain);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname + `/public/${d.getDay()}-exportdataAllEnterprise.xlsx`
            XLSX.utils.book_append_sheet(wb, ws, "sheet1");
            XLSX.writeFile(wb, down);
            res.download(down);
            //fs.unlink(__dirname + `/public/${d.getDay()}-exportdata.xlsx`)
        } else if (type === "csv") {

            var wb = XLSX.utils.book_new(); //new workbook
            var temp = JSON.stringify(blockchain);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname + `/public/${d.getDay()}-exportdataAllEnterprise.csv`
            XLSX.utils.book_append_sheet(wb, ws, "sheet1");
            XLSX.writeFile(wb, down);

            res.download(down);


        } else {
            res.status(400).send({
                status: true,
                message: "No existe la extensión del archivo solicitada"
            })
        }
    }else{
        res.status(400).send({
            status: true,
            message: "No existen usuarios"
        })
    }

    }

}

//Obtener blockchain


EnterpriseCtrl.getBlockChain = async(req,res)=>{
    let enterpriseId = req.params.enterpriseId
    let userId = req.params.userId

    let enterprise = await EnterpriseModel.findById(enterpriseId)

    let user = await UserModal.findById(userId)

    if(!enterprise){

        res.status(400).send({
            status: false,
            message: "No existe la empresa"
        })

    }else{

        if(!user){  
            
            res.status(400).send({
                status: false,
                message: "No existe el usuario"
            })


        }else{

            let blockchain = await BlockchainModal.find({enterpriseId: enterpriseId, userId: userId})

            let body = []


            if(blockchain.length > 0){

                
                /*let body = [];
                for(var i = 0; i < blockchain.length; i++){
                    body[i] =  JSON.parse(blockchain[i].body)
                    //console.log("body", body)
                    //blockchain[i].body = body
                   // blockchain.body_enterprise = body_enterprise

                }*/

               /* let prueba = [
                    {
                      _id: new ObjectId("63b647c5b3107e66230a14ca"),
                      hashMain: 'b3f0e069b36e8632e8b40245d1811499f00945810cf3febe9b2e8b0d61e3bb62',
                      hashEnterprise: '302113f89c075cbc4844c36c5700b9c68fb480593d48952aabcbe3259e072514',
                      previousHashMain: null,
                      previousHashEnterprise: null,
                      heigh: 0,
                      heighEnterprise: 0,
                      body: '{"hashMain":null,"hashEnterprise":null,"previousHashMain":null,"previousHashEnterprise":null,"heigh":0,"heighEnterprise":0,"body":null,"data":[{"tipo":"name","valor":"Boris","_id":"63b36389b6d5635be00ea1ac"},{"tipo":"lastName","valor":"Caiza","_id":"63b36389b6d5635be00ea1ad"},{"tipo":"phone","valor":"0991320401","_id":"63b36389b6d5635be00ea1ae"}],"permisos":[{"tipo":"Facturación Electronica2","valor":true,"data":["name","lastname"],"_id":"63b647c5b3107e66230a14ce"},{"tipo":"Machine Learning","valor":false,"descripcion":"Permiso para machine learning","data":["name","lastname"],"_id":"63b647c5b3107e66230a14cf"}],"userId":"63b362dcb6d5635be00ea1a1","enterpriseId":"63b362d8b6d5635be00ea19e","fechaModificacion":"1/4/2023, 10:45:09 PM","_id":"63b647c5b3107e66230a14ca"}',
                      data: [ [Object], [Object], [Object] ],
                      permisos: [ [Object], [Object] ],
                      userId: new ObjectId("63b362dcb6d5635be00ea1a1"),
                      enterpriseId: new ObjectId("63b362d8b6d5635be00ea19e"),
                      fechaModificacion: '1/4/2023, 10:45:09 PM',
                      __v: 0
                    }
                  ]*/

                  //const s =  `{"hashMain":null,"hashEnterprise":null,"previousHashMain":null,"previousHashEnterprise":null,"heigh":0,"heighEnterprise":0,"body":null,"data":[{"tipo":"name","valor":"Boris","_id":"63b36389b6d5635be00ea1ac"},{"tipo":"lastName","valor":"Caiza","_id":"63b36389b6d5635be00ea1ad"},{"tipo":"phone","valor":"0991320401","_id":"63b36389b6d5635be00ea1ae"}],"permisos":[{"tipo":"Facturación Electronica2","valor":true,"data":["name","lastname"],"_id":"63b647c5b3107e66230a14ce"},{"tipo":"Machine Learning","valor":false,"descripcion":"Permiso para machine learning","data":["name","lastname"],"_id":"63b647c5b3107e66230a14cf"}],"userId":"63b362dcb6d5635be00ea1a1","enterpriseId":"63b362d8b6d5635be00ea19e","fechaModificacion":"1/4/2023, 10:45:09 PM","_id":"63b647c5b3107e66230a14ca"}`
                
                console.log("holi",blockchain)

                res.status(200).send({
                    status: true,
                    blockchain: blockchain
                })
            }else{
                res.status(400).send({
                    status: false,
                    message: "No existe cadena"
                })
    
            }
        }
    }
}









module.exports = EnterpriseCtrl;