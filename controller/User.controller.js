const UserCtrl = {};
const UserModel = require('../model/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const EmailModel = require('../model/Email.model');
const EnterpriseModel = require("../model/Enterprise.model")
const BlockchainModel = require("../model/Blockchain.modal")
const ConsentModel = require("../model/Consent.model")
const Block = require('../src/block');
const SHA256 = require("crypto-js/sha256");
const { findById } = require('../model/Email.model');






//Para crear un usuario
UserCtrl.createUser = async (req, res) => {
    let { name, lastName, email, ci, password } = req.body




    const emailUser = await UserModel.findOne({ email: email })

    if (emailUser) {
        res.json({
            status: 'El correo ya existe o inválido'
        })
    }
    else {


        try {

            if (name && lastName && email && ci && password) {
                //Encriptar la contraseña y un token para la validacion
                password = await bcrypt.hash(password, 10)


                const NewUser = new UserModel({
                    name,
                    lastName,
                    email,
                    ci,
                    password
                })

                await NewUser.save();

                res.json({
                    status: "Usuario Guardado"
                })
            } else {
                res.json({
                    status: "LLene todos los campos"
                })
            }



        } catch (error) {
            console.log(error)

            res.json({
                status: "Error al guardar usuario"
            })

        }
    }


};


UserCtrl.login = async (req, res) => {

    const { email, password } = req.body

    const user = await UserModel.findOne({ email: email })

    const passwordCorrect = user === null
        ? false
        : await bcrypt.compare(password, user.password)

    if (!(user && passwordCorrect)) {
        return res.status(401).json({
            error: 'correo o contraseña invalida'
        })
    }

    const userForToken = {
        email: user.email,
        id: user._id,
        name: user.name
    }

    const token = jwt.sign(userForToken, "secreto")

    res
        .status(200)
        .send({ token, user })

}

//Actualziar un usuario
UserCtrl.updateUser = async (req, res) => {
    let date = new Date();
    let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

    let { arrayCambios } = req.body

    const usuario = await UserModel.findById(req.params.id);

    let name, lastName, email, ci;

    for(var i =0; i< arrayCambios.length; i++){
        if(arrayCambios[i].type =="name"){
            name = arrayCambios[i].value 
        }

        if(arrayCambios[i].type =="lastName"){
            lastName = arrayCambios[i].value 
        }

        if(arrayCambios[i].type =="email"){
            email = arrayCambios[i].value 
        }

        if(arrayCambios[i].type =="ci"){
            ci = arrayCambios[i].value 
        }
    }

    if (usuario) {
        const email2 = await UserModel.findOne({ email: arrayCambios.email });
        if (!email2) {

            try {

                const nuevoUsuario = {
                    name,
                    lastName,
                    email,
                    ci,

                };


                await UserModel.findByIdAndUpdate(req.params.id, nuevoUsuario, { userFindAndModify: false });

    
                let consentimiento = await ConsentModel.find({ "usuario.id": req.params.id })
                
          

                for (var i = 0; i < consentimiento.length; i++) {


                    for (var j = 0; j < consentimiento[i].data.length; j++) {
                        
                        let actualData =  consentimiento[i].data[j].tipo

                   

                        for(var k = 0; k < arrayCambios.length; k++){
                            

                            if(actualData === arrayCambios[k].type){

                                //console.log("valor",arrayCambios[k].value)
                               
                                consentimiento[i].data[j].valor = arrayCambios[k].value
                                
                                await consentimiento[i].save()
                            }

                            //console.log("hola",consentimiento[i].data[j])

                           
                        }
                    }

                }

                

                
                console.log("llegue hasta quí") 

                for(var i  = 0; i < consentimiento.length; i++){

                    const cadena = await BlockchainModel.find();

                    const blockNew = new BlockchainModel({
                        hashMain: null,
                        hashEnterprise: null,
                        previousHashEnterprise: null,
                        previousHashMain: null,
                        heigh: cadena.length,
                        body: null,
                        data: consentimiento[i].data,
                        permisos: consentimiento[i].permisos,
                        userId: consentimiento[i].usuario.id,
                        enterpriseId: consentimiento[i].empresa.id,
                        fechaModificacion: strTime
    
                    })
    
                    const idEmpresa = consentimiento[i].empresa.id
                   
    
                    const bloqueAnterior = await BlockchainModel.findOne({ heigh: cadena.length - 1 })
                    const bloqueAnteriorEmpresaArray = await BlockchainModel.find({ enterpriseId: idEmpresa })
                    console.log("esta es el array", bloqueAnteriorEmpresaArray)
                    let hashEmpresaAnterior;
                    let hashMainAnterior;
                    let heighEnterprise = 0
                    let bloqueAnteriorEmpresa;
    
                    if (bloqueAnteriorEmpresaArray.length > 0) {
                        console.log("entre", bloqueAnteriorEmpresaArray.length)

                        bloqueAnteriorEmpresa = await BlockchainModel.findOne({ heighEnterprise: bloqueAnteriorEmpresaArray.length - 1 })
                        hashEmpresaAnterior = null
                        hashMainAnterior = bloqueAnteriorEmpresa.hashMain
                        heighEnterprise = bloqueAnteriorEmpresaArray.length

                    } else {
                        bloqueAnteriorEmpresa = null;
                        hashEmpresaAnterior = null
                        hashMainAnterior = null
                        heighEnterprise = 0
                    }
    
    
                    const block = new Block({ data: blockNew });
                    const hashEnterprise = strTime + consentimiento[i].empresa.id
                    block.hashMain = SHA256(JSON.stringify(block)).toString();
                    block.hashEnterprise = SHA256(JSON.stringify(hashEnterprise)).toString();
                    block.height = cadena.length
                    block.heighEnterprise = heighEnterprise
                    block.permisos = consentimiento[i].permisos
                    block.data = consentimiento[i].data
                    block.userId = consentimiento[i].usuario.id
                    block.enterpriseId = consentimiento[i].empresa.id
                    block.fechaModificacion = strTime
                    block.previousHashEnterprise = hashEmpresaAnterior
                    block.previousHashMain = bloqueAnterior.hashMain
                   
    
                 
    
    
                    blockNew.hashMain = block.hashMain
                    blockNew.hashEnterprise = block.hashEnterprise
                    blockNew.previousHashMain = block.previousHashMain
                    blockNew.previousHashEnterprise = block.previousHashEnterprise
                    blockNew.heigh = block.height
                    blockNew.heighEnterprise = block.heighEnterprise
                    blockNew.body = block.body
                    blockNew.permisos = block.permisos
                    blockNew.data = block.data
                    blockNew.userId = block.userId
                    blockNew.enterpriseId = block.enterpriseId
                    blockNew.fechaModificacion = strTime
    
                  
    
                    await blockNew.save()
    

                }

               

            

                res.json({
                    status: 'Usuario actualizado'
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

    }else{
        res.json({
            status:"No existe el usuario"
        })
    }
};

UserCtrl.getEmails = async (req, res) => {

    var id = req.params.id

    var user = await UserModel.findById(id)

    if (user) {

        let emails = await EmailModel.find({ idUsuario: user._id, respondido: false })

        if (emails) {
            res.send(emails)
        } else {
            res.json({
                status: "No Existen Emails"
            })
        }

    } else {
        res.json({
            status: "No existe el usuario"
        })
    }
}

UserCtrl.acceptConsent = async (req, res) => {
    var idEmail = req.params.id

    var email = await EmailModel.findById(idEmail)


    if (email) {

        if (!email.respondido) {

            const cadena = await BlockchainModel.find();

            let date = new Date();
            let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });


            if (cadena.length === 0) {

                const blockNew = new BlockchainModel({
                    hashMain: null,
                    hashEnterprise: null,
                    previousHashEnterprise: null,
                    previousHashMain: null,
                    heigh: 0,
                    heighEnterprise: 0,
                    body: null,
                    permisos: {
                        envioFacturacion: envioFacturacion,
                        machineLearning: machineLearning,
                    },
                    userId: email.idUsuario,
                    enterpriseId: email.idEmpresa,
                    fechaModificacion: strTime

                })

                const block = new Block({ data: blockNew });
                const hashEnterprise = strTime + email.idEmpresa
                block.hashMain = SHA256(JSON.stringify(block)).toString();
                block.hashEnterprise = SHA256(JSON.stringify(hashEnterprise)).toString();
                block.height = 0
                block.heighEnterprise = 0
                block.permisos.envioFacturacion = envioFacturacion;
                block.permisos.machineLearning = machineLearning
                block.userId = email.idUsuario
                block.enterpriseId = email.idEmpresa
                block.fechaModificacion = strTime


                blockNew.hashMain = block.hashMain
                blockNew.hashEnterprise = block.hashEnterprise
                blockNew.previousHashMain = null
                blockNew.previousHashEnterprise = null
                blockNew.heigh = block.height
                blockNew.heighEnterprise = block.heighEnterprise
                blockNew.body = block.body
                blockNew.permisos.envioFacturacion = block.permisos.envioFacturacion
                blockNew.permisos.machineLearning = block.permisos.machineLearning
                blockNew.userId = email.idUsuario
                blockNew.enterpriseId = email.idEmpresa
                blockNew.fechaModificacion = strTime

                email.respondido = true;

                await email.save()
                await blockNew.save()


                let newConsent = new ConsentModel({
                    userId: email.userId,
                    permisos: permisosAux,
                    enterpriseId: email.enterpriseId,
                    fechaModificacion: strTime
                })

                await newConsent.save()


                res.json({
                    status: "ok"
                })


            } else {

                const blockNew = new BlockchainModel({
                    hashMain: null,
                    hashEnterprise: null,
                    previousHashEnterprise: null,
                    previousHashMain: null,
                    heigh: cadena.length,
                    body: null,
                    permisos: {
                        envioFacturacion: envioFacturacion,
                        machineLearning: machineLearning,
                    },
                    userId: email.idUsuario,
                    enterpriseId: email.idEmpresa,
                    fechaModificacion: strTime

                })

                const idEmpresa = email.idEmpresa
                const idUsuario = email.idUsuario

                //console.log("empresa y usuario", idEmpresa, idUsuario)

                const bloqueAnterior = await BlockchainModel.findOne({ heigh: cadena.length - 1 })
                const bloqueAnteriorEmpresaArray = await BlockchainModel.find({ enterpriseId: idEmpresa })
                console.log("esta es el array", bloqueAnteriorEmpresaArray)
                let hashEmpresaAnterior;
                let hashMainAnterior;
                let heighEnterprise = 0
                let bloqueAnteriorEmpresa;

                if (bloqueAnteriorEmpresaArray.length > 0) {
                    console.log("entre", bloqueAnteriorEmpresaArray.length)
                    bloqueAnteriorEmpresa = await BlockchainModel.findOne({ heighEnterprise: bloqueAnteriorEmpresaArray.length - 1 })
                    console.log("bloque indivudal", bloqueAnteriorEmpresa)
                    hashEmpresaAnterior = null
                    hashMainAnterior = bloqueAnteriorEmpresa.hashMain
                    heighEnterprise = bloqueAnteriorEmpresaArray.length
                    //console.log("hash empresa, hash main", hashMain, hashEnterprise)
                } else {
                    bloqueAnteriorEmpresa = null;
                    hashEmpresaAnterior = null
                    hashMainAnterior = null
                    heighEnterprise = 0
                }


                const block = new Block({ data: blockNew });
                const hashEnterprise = strTime + email.idEmpresa
                block.hashMain = SHA256(JSON.stringify(block)).toString();
                block.hashEnterprise = SHA256(JSON.stringify(hashEnterprise)).toString();
                block.height = cadena.length
                block.heighEnterprise = heighEnterprise
                block.permisos.envioFacturacion = envioFacturacion;
                block.permisos.machineLearning = machineLearning
                block.userId = email.idUsuario
                block.enterpriseId = email.idEmpresa
                block.fechaModificacion = strTime
                block.previousHashEnterprise = hashEmpresaAnterior
                block.previousHashMain = bloqueAnterior.hashMain

                console.log("bloques", block.previousHashEnterprise, block.previousHashMain)


                blockNew.hashMain = block.hashMain
                blockNew.hashEnterprise = block.hashEnterprise
                blockNew.previousHashMain = block.previousHashMain
                blockNew.previousHashEnterprise = block.previousHashEnterprise
                blockNew.heigh = block.height
                blockNew.heighEnterprise = block.heighEnterprise
                blockNew.body = block.body
                blockNew.permisos.envioFacturacion = block.permisos.envioFacturacion
                blockNew.permisos.machineLearning = block.permisos.machineLearning
                blockNew.userId = email.idUsuario
                blockNew.enterpriseId = email.idEmpresa
                blockNew.fechaModificacion = strTime

                email.respondido = true;

                await email.save()

                await blockNew.save()


                let newConsent = new ConsentModel({
                    userId: email.userId,
                    permisos: permisosAux,
                    enterpriseId: email.enterpriseId,
                    fechaModificacion: strTime
                })

                await newConsent.save()


                res.send({
                    status: "Has aceptado los permisos seleccionados"
                })

            }

        } else {
            res.json({
                status: "El email ya esta respondido"
            })
        }





    } else {
        res.json({
            status: "No existe el email"
        })
    }

}



UserCtrl.acceptAllConsent = async (req, res) => {

    var idEmail = req.params.id

    var email = await EmailModel.findById(idEmail)

    //console.log("este es email",email)

    if (email) {

        if (!email.respondido) {

            const cadena = await BlockchainModel.find();

            let date = new Date();
            let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

            let permisosAux = email.permisos

            for (var i = 0; i < permisosAux.length; i++) {
                permisosAux[i].valor = true
            }

            let usuario = await UserModel.findById(email.usuario.id)

            if (usuario) {

                if (cadena.length === 0) {

                    const blockNew = new BlockchainModel({
                        hashMain: null,
                        hashEnterprise: null,
                        previousHashEnterprise: null,
                        previousHashMain: null,
                        heigh: 0,
                        heighEnterprise: 0,
                        body: null,
                        permisos: permisosAux,
                        userId: email.idUsuario,
                        enterpriseId: email.idEmpresa,
                        fechaModificacion: strTime

                    })

                    const block = new Block({ data: blockNew });
                    const hashEnterprise = strTime + email.idEmpresa
                    block.hashMain = SHA256(JSON.stringify(block)).toString();
                    block.hashEnterprise = SHA256(JSON.stringify(hashEnterprise)).toString();
                    block.height = 0
                    block.heighEnterprise = 0
                    block.permisos = permisosAux
                    block.userId = email.usuario.id
                    block.enterpriseId = email.empresa.id
                    block.fechaModificacion = strTime


                    blockNew.hashMain = block.hashMain
                    blockNew.hashEnterprise = block.hashEnterprise
                    blockNew.previousHashMain = null
                    blockNew.previousHashEnterprise = null
                    blockNew.heigh = block.height
                    blockNew.heighEnterprise = block.heighEnterprise
                    blockNew.body = block.body
                    blockNew.permisos = block.permisos
                    blockNew.userId = block.userId
                    blockNew.enterpriseId = block.enterpriseId
                    blockNew.fechaModificacion = strTime

                    email.respondido = true;
                    for (var i = 0; i < email.permisos; i++) {
                        email.permisos.valor = false
                    }

                    await email.save()


                    await blockNew.save()


                    let newConsent = new ConsentModel({
                        empresa: {
                            id: email.empresa.id,
                            name: email.empresa.name
                        },
                        usuario: {
                            id: email.usuario.id,
                            name: email.usuario.name
                        },
                        permisos: permisosAux,
                        data: email.data,
                        fechaModificacion: strTime,
                        fechaFinConsentimeinto: email.fechaFin
                    })

                    await newConsent.save()



                    res.json({
                        status: "ok"
                    })


                } else {

                    const blockNew = new BlockchainModel({
                        hashMain: null,
                        hashEnterprise: null,
                        previousHashEnterprise: null,
                        previousHashMain: null,
                        heigh: cadena.length,
                        body: null,
                        permisos: permisosAux,
                        userId: email.idUsuario,
                        enterpriseId: email.idEmpresa,
                        fechaModificacion: strTime

                    })

                    const idEmpresa = email.idEmpresa
                    //const idUsuario = email.idUsuario



                    const bloqueAnterior = await BlockchainModel.findOne({ heigh: cadena.length - 1 })
                    const bloqueAnteriorEmpresaArray = await BlockchainModel.find({ enterpriseId: idEmpresa })
                    //console.log("esta es el array", bloqueAnteriorEmpresaArray)
                    let hashEmpresaAnterior;
                    let hashMainAnterior;
                    let heighEnterprise = 0
                    let bloqueAnteriorEmpresa;

                    if (bloqueAnteriorEmpresaArray.length > 0) {
                        // console.log("entre", bloqueAnteriorEmpresaArray.length)
                        bloqueAnteriorEmpresa = await BlockchainModel.findOne({ heighEnterprise: bloqueAnteriorEmpresaArray.length - 1 })
                        //console.log("bloque indivudal", bloqueAnteriorEmpresa)
                        // hashEmpresaAnterior = null
                        hashMainAnterior = bloqueAnteriorEmpresa.hashMain
                        heighEnterprise = bloqueAnteriorEmpresaArray.length
                        //console.log("hash empresa, hash main", hashMain, hashEnterprise)
                        //console.log("bloque anterior",bloqueAnteriorEmpresa)
                        //console.log("este es el email", email)

                        let bloquesCadena = await BlockchainModel.find({ enterpriseId: email.idEmpresa })
                        if (bloquesCadena.length > 0) {
                            let bloqueFinal = bloquesCadena[bloquesCadena.length - 1]
                            hashEmpresaAnterior = bloqueFinal.hashEnterprise
                        }

                    } else {
                        bloqueAnteriorEmpresa = null;
                        hashEmpresaAnterior = null
                        hashMainAnterior = null
                        heighEnterprise = 0
                    }


                    const block = new Block({ data: blockNew });
                    const hashEnterprise = strTime + email.idEmpresa
                    block.hashMain = SHA256(JSON.stringify(block)).toString();
                    block.hashEnterprise = SHA256(JSON.stringify(hashEnterprise)).toString();
                    block.height = cadena.length
                    block.heighEnterprise = heighEnterprise
                    block.permisos = permisosAux
                    block.userId = email.usuario.id
                    block.enterpriseId = email.empresa.id
                    block.fechaModificacion = strTime
                    block.previousHashEnterprise = hashEmpresaAnterior
                    console.log("hash empresa  anterior", hashEmpresaAnterior)
                    block.previousHashMain = bloqueAnterior.hashMain

                    // console.log("bloques",block.previousHashEnterprise, block.previousHashMain)


                    blockNew.hashMain = block.hashMain
                    blockNew.hashEnterprise = block.hashEnterprise
                    blockNew.previousHashMain = block.previousHashMain
                    blockNew.previousHashEnterprise = block.previousHashEnterprise
                    blockNew.heigh = block.height
                    blockNew.heighEnterprise = block.heighEnterprise
                    blockNew.body = block.body
                    blockNew.permisos = block.permisos
                    blockNew.userId = block.userId
                    blockNew.enterpriseId = block.enterpriseId
                    blockNew.fechaModificacion = strTime

                    email.respondido = true;

                    for (var i = 0; i < email.permisos; i++) {
                        email.permisos.valor = false
                    }

                    await email.save()
                    await blockNew.save()

                  
                    let newConsent = new ConsentModel({
                        empresa: {
                            id: email.empresa.id,
                            name: email.empresa.name
                        },
                        usuario: {
                            id: email.usuario.id,
                            name: email.usuario.name
                        },
                        permisos: permisosAux,
                        data: email.data,
                        fechaModificacion: strTime,
                        fechaFinConsentimeinto: email.fechaFin
                    })

                    await newConsent.save()





                    res.send({
                        status: "Has aceptado todo los permisos"
                    })

                }
            } else {
                res.json({
                    status: "No existe el usuario"
                })
            }
        } else {
            res.json({
                status: "El email ya esta respondido"
            })
        }





    } else {
        res.json({
            status: "No existe el email"
        })
    }

}

UserCtrl.rejectAllConsent = async (req, res) => {

    var idEmail = req.params.id

    var email = await EmailModel.findById(idEmail)

    if (email) {

        email.respondido = true

        await email.save()

        //console.log(permisos)

        res.json({
            status: "Has rechazado todos los permisos"
        })

    } else {
        res.json({
            status: "No existe el email"
        })
    }

}







module.exports = UserCtrl;



