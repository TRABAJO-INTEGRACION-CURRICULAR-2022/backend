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
const BlockchainModal = require('../model/Blockchain.modal');
var XLSX = require('xlsx');
const { RIPEMD160, TripleDES } = require('crypto-js');
var aspose = aspose || {};
const fs = require('fs');
aspose.cells = require("aspose.cells");
const {generarLlave, cifradoA, decifradoA} = require("../helpers/cifrado")


//var json2xlsx = require('node-json-xlsx');






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

//Obtener user por id

UserCtrl.getUserbyId = async (req, res) => {
    let id = req.params.id

    let user = await UserModel.findById(id)

    if (user) {

        res.status(200).send({
            status: true,
            user: user
        })

    } else {

        res.status(400).send({
            status: false,
            message: "No existe el usuario"
        })

    }
}

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

    for (var i = 0; i < arrayCambios.length; i++) {


        if (arrayCambios[i].type == "name") {
            name = arrayCambios[i].value
        }

        if (arrayCambios[i].type == "lastName") {
            lastName = arrayCambios[i].value
        }

        if (arrayCambios[i].type == "email") {
            email = arrayCambios[i].value
        }

        if (arrayCambios[i].type == "ci") {
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

                    if (name) {
                        consentimiento[i].usuario.name = name
                    }

                    for (var j = 0; j < consentimiento[i].data.length; j++) {

                        let actualData = consentimiento[i].data[j].tipo



                        for (var k = 0; k < arrayCambios.length; k++) {


                            if (actualData === arrayCambios[k].type) {

                                //console.log("valor",arrayCambios[k].value)

                                consentimiento[i].data[j].valor = arrayCambios[k].value

                                await consentimiento[i].save()
                            }

                            //console.log("hola",consentimiento[i].data[j])


                        }
                    }

                }






                for (var i = 0; i < consentimiento.length; i++) {

                    const cadena = await BlockchainModel.find();



                    const idEmpresa = consentimiento[i].empresa.id


                    const bloqueAnterior = await BlockchainModel.findOne({ heigh: cadena.length - 1 })
                    const bloqueAnteriorEmpresaArray = await BlockchainModel.find({ enterpriseId: idEmpresa })
                    //console.log("esta es el array", bloqueAnteriorEmpresaArray)
                    let hashEmpresaAnterior;
                    let hashMainAnterior;
                    let heighEnterprise = 0
                    let bloqueAnteriorEmpresa;

                    if (bloqueAnteriorEmpresaArray.length > 0) {


                        bloqueAnteriorEmpresa = await BlockchainModel.findOne({ heighEnterprise: bloqueAnteriorEmpresaArray.length - 1 })

                        hashMainAnterior = bloqueAnteriorEmpresa.hashMain
                        heighEnterprise = bloqueAnteriorEmpresaArray.length

                        let bloquesCadena = await BlockchainModel.find({ enterpriseId: idEmpresa })
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

                    const blockNew = new BlockchainModel({
                        hashMain: null,
                        hashEnterprise: null,
                        previousHashEnterprise: hashEmpresaAnterior,
                        previousHashMain: bloqueAnterior.hashMain,
                        heigh: cadena.length,
                        body: null,
                        body_enterprise: null,
                        data: consentimiento[i].data,
                        permisos: consentimiento[i].permisos,
                        userId: consentimiento[i].usuario.id,
                        enterpriseId: consentimiento[i].empresa.id,
                        fechaModificacion: strTime

                    })


                    let body = JSON.stringify(blockNew)

                    blockNew.body = body

                    const hashEnterprise = JSON.stringify(strTime + email.empresa.id + blockNew)
                    blockNew.body_enterprise = hashEnterprise
                    blockNew.hashMain = SHA256((body)).toString();
                    blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();



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

    } else {
        res.json({
            status: "No existe el usuario"
        })
    }
};

//Obtener emails
UserCtrl.getEmails = async (req, res) => {

    var id = req.params.id

    var user = await UserModel.findById(id)

    if (user) {

        let emails = await EmailModel.find({ idUsuario: user._id, respondido: false })


        if (emails) {

            let enviarEmails = []

            for (var i = 0; i < emails.length; i++) {

                enviarEmails[i] = {
                    id: emails[i]._id,
                    nombreEmpresa: emails[i].empresa.name,
                    descrpcion: emails[i].descripcionConcentimiento,
                    fechaEnvio: emails[i].fechaEnvio

                }

            }

            res.send(enviarEmails)
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
//Obtener un email especifico
UserCtrl.getEmail = async (req, res) => {
    var id = req.params.id

    let email = await EmailModel.findById(id)


    if (email) {
        res.send(email)
    } else {
        res.status(404).send({
            status: false,
            message: "No existe el email"
        })
    }
}


//Aceptar consentimiento
UserCtrl.acceptConsent = async (req, res) => {


    var idEmail = req.params.id

    var email = await EmailModel.findById(idEmail)

    var { permisos, data, fechaFin } = req.body

    if (!permisos) {

        res.json({
            status: "Permisos esta vació"
        })
    } else {

        if (email) {

            if (!email.respondido) {

                const cadena = await BlockchainModel.find();

                let date = new Date();
                let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

                let permisosAux = permisos

                let permisosTrue = []

                for (var i = 0; i < permisos.length; i++) {
                    if (permisos[i].valor === true) {
                        permisosTrue[i] = permisos[i]
                    }
                }



                let usuario = await UserModel.findById(email.usuario.id)

                if (usuario) {

                    let enterprise = await EnterpriseModel.findById(email.empresa.id)

                    for(var i = 0; i < data.length; i++){

                        data[i].valor = cifradoA(enterprise.key, data[i].valor)
                            
                    }


                    if (cadena.length === 0) {

                       
                        const blockNew = new BlockchainModel({
                            hashMain: null,
                            hashEnterprise: null,
                            previousHashEnterprise: null,
                            previousHashMain: null,
                            heigh: 0,
                            heighEnterprise: 0,
                            body: null,
                            body_enterprise: null,
                            data: data,
                            permisos: permisosAux,
                            userId: email.usuario.id,
                            enterpriseId: email.empresa.id,
                            fechaModificacion: strTime,
                            fechaFinConsentimeinto: fechaFin

                        })

                        let body = JSON.stringify(blockNew)

                        blockNew.body = body

                        const hashEnterprise = JSON.stringify(strTime + email.empresa.id + blockNew)
                        blockNew.body_enterprise = hashEnterprise
                        blockNew.hashMain = SHA256((body)).toString();
                        blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();



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
                            permisos: permisosTrue,
                            data: data,
                            fechaModificacion: strTime,
                            fechaFinConsentimeinto: fechaFin,
                            activo: true
                        })

                        await newConsent.save()



                        res.json({
                            status: "ok"
                        })


                    } else {



                        const idEmpresa = email.empresa.id
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

                            let bloquesCadena = await BlockchainModel.find({ enterpriseId: email.empresa.id })
                            //console.log("se supone que el otro bloque", bloquesCadena)
                            if (bloquesCadena.length > 0) {
                                console.log("entre al if")
                                let bloqueFinal = bloquesCadena[bloquesCadena.length - 1]
                                hashEmpresaAnterior = bloqueFinal.hashEnterprise
                            }

                        } else {
                            bloqueAnteriorEmpresa = null;
                            hashEmpresaAnterior = null
                            hashMainAnterior = null
                            heighEnterprise = 0
                        }

                        const blockNew = new BlockchainModel({
                            hashMain: null,
                            hashEnterprise: null,
                            previousHashEnterprise: hashEmpresaAnterior,
                            previousHashMain: bloqueAnterior.hashMain,
                            heigh: cadena.length,
                            heighEnterprise: heighEnterprise,
                            body: null,
                            body_enterprise: null,
                            data: data,
                            permisos: permisosAux,
                            userId: email.usuario.id,
                            enterpriseId: email.empresa.id,
                            fechaModificacion: strTime,
                            fechaFinConsentimeinto: fechaFin

                        })

                        let body = JSON.stringify(blockNew)

                        blockNew.body = body

                        const hashEnterprise = JSON.stringify(strTime + email.empresa.id + blockNew)
                        blockNew.body_enterprise = hashEnterprise
                        blockNew.hashMain = SHA256((body)).toString();
                        blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();







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
                            permisos: permisosTrue,
                            data: data,
                            fechaModificacion: strTime,
                            fechaFinConsentimeinto: fechaFin,
                            activo: true
                        })

                        await newConsent.save()





                        res.send({
                            status: "Consentimiento guardado"
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

}
/*
//Aceptar algunos consentimientos
UserCtrl.acceptAllConsent = async (req, res) => {

    var idEmail = req.params.id

    var email = await EmailModel.findById(idEmail)
    var { permisos, data } = req.body
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
                        data: data,
                        permisos: permisosAux,
                        userId: email.usuario.id,
                        enterpriseId: email.empresa.id,
                        fechaModificacion: strTime

                    })

                    const block = new Block({ data: blockNew });
                    const hashEnterprise = strTime + email.empresa.id
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
                        data: data,
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
                        heigh: 0,
                        heighEnterprise: 0,
                        body: null,
                        data: data,
                        permisos: permisosAux,
                        userId: email.usuario.id,
                        enterpriseId: email.empresa.id,
                        fechaModificacion: strTime

                    })


                    const idEmpresa = email.empresa.id
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

                        let bloquesCadena = await BlockchainModel.find({ enterpriseId: email.empresa.id })
                        // console.log("se supone que el otro bloque", bloquesCadena)
                        if (bloquesCadena.length > 0) {
                            console.log("entre al if")
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
                    const hashEnterprise = strTime + email.empresa.id
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
                        data: data,
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

}*/

//Rechazar todo el consentimeinto
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


//obtener nombre, fechaFin y email del consetimeinto por id del usuario
UserCtrl.getEnterprisestreatments = async (req, res) => {

    let id = req.params.id

    let user = await UserModel.findById(id)

    if (user) {
        let consents = await ConsentModel.find({ "usuario.id": id })

        let sendConsent = []

        for (var i = 0; i < consents.length; i++) {
            sendConsent[i] = {
                _id: consents[i]._id,
                fechaFin: consents[i].fechaFinConsentimeinto,
                name: consents[i].empresa.name
            }
        }

        res.send(sendConsent)

    } else {
        res.json({
            status: "No existe el usuario"
        })
    }
}


//Obtener todoDel tratamientop
UserCtrl.getEnterprisetreatment = async (req, res) => {

    let idConsent = req.params.id

    let consent = await ConsentModel.findById(idConsent)



    if (consent) {

        let enterprise = await EnterpriseModel.findById(consent.empresa.id)

        for(var i = 0; i < consent.data.length; i++){

            consent.data[i].valor = decifradoA(enterprise.key,consent.data[i].valor)
        }

        res.send(consent)

    } else {
        res.json({
            status: "No existe el consentimiento"
        })
    }
}

//Actualziar tratamiento

UserCtrl.updateTreatmente = async (req, res) => {

    let date = new Date();
    let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

    let id = req.params.id

    let consent = await ConsentModel.findById(id)

    if (!consent) {

        res.status(400).send({
            status: true,
            message: "No existe el consentimiento"
        })

    } else {


        let { treatmentsToEliminate } = req.body

        if (treatmentsToEliminate) {

            let consents = []

            for (var i = 0; i < treatmentsToEliminate.length; i++) {

                consents[i] = await ConsentModel.find({ _id: id, permisos: { $elemMatch: { _id: treatmentsToEliminate[i] } } })

                await ConsentModel.updateOne(
                    { _id: id },
                    { $pull: { "permisos": { "_id": treatmentsToEliminate[i] } } }
                );


            }

            const cadena = await BlockchainModel.find();

            let actualConsent = await ConsentModel.findById(id)


            const idEmpresa = actualConsent.empresa.id
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
                let bloquesCadena = await BlockchainModel.find({ enterpriseId: idEmpresa })
                //console.log("se supone que el otro bloque", bloquesCadena)
                if (bloquesCadena.length > 0) {
                    console.log("entre al if")
                    let bloqueFinal = bloquesCadena[bloquesCadena.length - 1]
                    hashEmpresaAnterior = bloqueFinal.hashEnterprise
                }

            } else {
                bloqueAnteriorEmpresa = null;
                hashEmpresaAnterior = null
                hashMainAnterior = null
                heighEnterprise = 0
            }

            const blockNew = new BlockchainModel({
                hashMain: null,
                hashEnterprise: null,
                previousHashEnterprise: hashEmpresaAnterior,
                previousHashMain: bloqueAnterior.hashMain,
                heigh: cadena.length,
                heighEnterprise: heighEnterprise,
                body: null,
                body_enterprise: null,
                data: actualConsent.data,
                permisos: actualConsent.permisos,
                userId: actualConsent.usuario.id,
                enterpriseId: actualConsent.empresa.id,
                fechaModificacion: strTime

            })

            let body = JSON.stringify(blockNew)

            blockNew.body = body

            const hashEnterprise = JSON.stringify(strTime + actualConsent.empresa.id + blockNew)
            blockNew.body_enterprise = hashEnterprise
            blockNew.hashMain = SHA256((body)).toString();
            blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();


            await blockNew.save()


            res.status(200).send({
                status: true,
                message: "Tratamiento actualizado"
            })

        } else {

        }
    }



}

//Borrar consentimiento

UserCtrl.deleteConsent = async (req, res) => {

    let id = req.params.id

    let date = new Date();
    let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });


    let consent = await ConsentModel.findById(id)

    if (!consent) {

        res.status(400).send({
            status: false,
            message: "No existe el consentimiento"
        })

    } else {

        consent.activo = false
        consent.fechaFinConsentimeinto = strTime


        await consent.save()

       


        let actualConsent = await ConsentModel.findById(id)

        const cadena = await BlockchainModel.find();


        const idEmpresa = actualConsent.empresa.id




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
            let bloquesCadena = await BlockchainModel.find({ enterpriseId: idEmpresa })
            //console.log("se supone que el otro bloque", bloquesCadena)
            if (bloquesCadena.length > 0) {
                console.log("entre al if")
                let bloqueFinal = bloquesCadena[bloquesCadena.length - 1]
                hashEmpresaAnterior = bloqueFinal.hashEnterprise
            }

        } else {
            bloqueAnteriorEmpresa = null;
            hashEmpresaAnterior = null
            hashMainAnterior = null
            heighEnterprise = 0
        }

        const blockNew = new BlockchainModel({
            hashMain: null,
            hashEnterprise: null,
            previousHashEnterprise: hashEmpresaAnterior,
            previousHashMain: bloqueAnterior.hashMain,
            heigh: cadena.length,
            heighEnterprise: heighEnterprise,
            body: null,
            body_enterprise: null,
            data: actualConsent.data,
            permisos: actualConsent.permisos,
            userId: actualConsent.usuario.id,
            enterpriseId: actualConsent.empresa.id,
            fechaModificacion: strTime,
            fechaFinConsentimeinto: strTime

        })

        let body = JSON.stringify(blockNew)

        blockNew.body = body

        const hashEnterprise = JSON.stringify(strTime + actualConsent.empresa.id + blockNew)
        blockNew.body_enterprise = hashEnterprise
        blockNew.hashMain = SHA256((body)).toString();
        blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();


        await blockNew.save()



        res.status(200).send({
            status: true,
            message: "Consentimeinto eliminado"
        })

    }

}

//Actualziar data

UserCtrl.updateData = async (req, res) => {

    let date = new Date();
    let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });


    let id = req.params.id

    let user = await UserModel.findById(id)

    if (!user) {
        res.status(400).send({
            status: false,
            message: "El usuario no existe"
        })
    } else {

        let consent = await ConsentModel.find({ "usuario.id": id })


        if (!consent) {

            res.status(400).send({
                status: false,
                message: "El existen consentimientos de ese usuario"
            })

        } else {

            let { data } = req.body

            let name, lastName, email, ci;


            for (var i = 0; i < data.length; i++) {


                if (data[i].tipo == "name") {
                    name = data[i].valor
                }

                if (data[i].tipo == "lastName") {
                    lastName = data[i].valor
                }

                if (data[i].tipo == "email") {
                    email = data[i].valor
                }

                if (data[i].tipo == "ci") {
                    ci = data[i].valor
                }
            }



            const email2 = await UserModel.findOne({ email: email });
            if (!email2) {

                try {

                    const nuevoUsuario = {
                        name,
                        lastName,
                        email,
                        ci,

                    };


                    await UserModel.findByIdAndUpdate(req.params.id, nuevoUsuario, { userFindAndModify: false });



                } catch (error) {

                    res.status(400).send({
                        status: false,
                        message: "error ala ctualziar data"
                    })
                }

            }


            for (var k = 0; k < consent.length; k++) {
                let enterprise = await EnterpriseModel.findById(consent[k].empresa.id)
                let existingData = consent[k].data
                for (var i = 0; i < existingData.length; i++) {
                    for (var j = 0; j < data.length; j++) {
                        if (existingData[i].tipo === data[j].tipo) {
                             
                            existingData[i].valor = cifradoA(enterprise.key,data[j].valor)
                        }

                    }

                }
                consent[k].data = existingData


                await consent[k].save()
            }



            let newConsents = await ConsentModel.find({ "usuario.id": req.params.id })




            for (var i = 0; i < newConsents.length; i++) {

                const cadena = await BlockchainModel.find();

                let actualConsent = newConsents[i]

                const idEmpresa = actualConsent.empresa.id




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
                    let bloquesCadena = await BlockchainModel.find({ enterpriseId: idEmpresa })
                    //console.log("se supone que el otro bloque", bloquesCadena)
                    if (bloquesCadena.length > 0) {
                        console.log("entre al if")
                        let bloqueFinal = bloquesCadena[bloquesCadena.length - 1]
                        hashEmpresaAnterior = bloqueFinal.hashEnterprise
                    }

                } else {
                    bloqueAnteriorEmpresa = null;
                    hashEmpresaAnterior = null
                    hashMainAnterior = null
                    heighEnterprise = 0
                }

                const blockNew = new BlockchainModel({
                    hashMain: null,
                    hashEnterprise: null,
                    previousHashEnterprise: hashEmpresaAnterior,
                    previousHashMain: bloqueAnterior.hashMain,
                    heigh: cadena.length,
                    heighEnterprise: heighEnterprise,
                    body: null,
                    body_enterprise: null,
                    data: actualConsent.data,
                    permisos: actualConsent.permisos,
                    userId: actualConsent.usuario.id,
                    enterpriseId: actualConsent.empresa.id,
                    fechaModificacion: strTime,
                    fechaFinConsentimeinto: actualConsent.fechaFinConsentimeinto

                })

                let body = JSON.stringify(blockNew)

                blockNew.body = body

                const hashEnterprise = JSON.stringify(strTime + actualConsent.empresa.id + blockNew)
                blockNew.body_enterprise = hashEnterprise
                blockNew.hashMain = SHA256((body)).toString();
                blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();


                await blockNew.save()


            }




            res.status(200).send({
                status: true,
                message: "Data actualizada"
            })

        }
    }


}

//Editar Fecha Fin consentimeinto 

UserCtrl.updateDateEndConsent = async (req, res) => {

    let id = req.params.id

    let consent = await ConsentModel.findById(id)
    let date = new Date();
    let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });


    if (!consent) {

        res.status(400).send({
            status: false,
            message: "No existe el conentimeinto"
        })

    } else {

        let { fechaFin } = req.body


        if (!fechaFin) {

            res.status(400).send({
                status: false,
                message: "No existe la fecha"
            })

        } else {

            consent.fechaFinConsentimeinto = fechaFin



            await consent.save()


            let actualConsent = await ConsentModel.findById(id)

            const cadena = await BlockchainModel.find();


            const idEmpresa = actualConsent.empresa.id




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
                let bloquesCadena = await BlockchainModel.find({ enterpriseId: idEmpresa })
                //console.log("se supone que el otro bloque", bloquesCadena)
                if (bloquesCadena.length > 0) {
                    console.log("entre al if")
                    let bloqueFinal = bloquesCadena[bloquesCadena.length - 1]
                    hashEmpresaAnterior = bloqueFinal.hashEnterprise
                }

            } else {
                bloqueAnteriorEmpresa = null;
                hashEmpresaAnterior = null
                hashMainAnterior = null
                heighEnterprise = 0
            }

            const blockNew = new BlockchainModel({
                hashMain: null,
                hashEnterprise: null,
                previousHashEnterprise: hashEmpresaAnterior,
                previousHashMain: bloqueAnterior.hashMain,
                heigh: cadena.length,
                heighEnterprise: heighEnterprise,
                body: null,
                body_enterprise: null,
                data: actualConsent.data,
                permisos: actualConsent.permisos,
                userId: actualConsent.usuario.id,
                enterpriseId: actualConsent.empresa.id,
                fechaModificacion: strTime,
                fechaFinConsentimeinto: fechaFin

            })

            let body = JSON.stringify(blockNew)

            blockNew.body = body

            const hashEnterprise = JSON.stringify(strTime + actualConsent.empresa.id + blockNew)
            blockNew.body_enterprise = hashEnterprise
            blockNew.hashMain = SHA256((body)).toString();
            blockNew.hashEnterprise = SHA256((hashEnterprise)).toString();


            await blockNew.save()


            res.status(200).send({
                status: true,
                message: "Fecha de finalización de consentimeinto actualizada"
            })
        }

    }
}


//Obtener historial

UserCtrl.getHistory = async (req, res) => {
    let id = req.params.id

    let user = await UserModel.findById(id)


    if (!user) {

        res.status(400).send({
            status: false,
            message: "El usuario no existe"
        })

    } else {

        let consents = await ConsentModel.find({ "usuario.id": id })

        let sendConsent = []

        for (var i = 0; i < consents.length; i++) {
            sendConsent[i] = {
                _id: consents[i]._id,
                fechaFin: consents[i].fechaFinConsentimeinto,
                name: consents[i].empresa.name
            }
        }

        res.send(sendConsent)





    }
}

//Exportar data



UserCtrl.exportAllEnterpriseAndUser = async (req, res) => {

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


        let user = await UserModel.findById(userId)


        if (!user) {


            res.status(400).send({
                status: false,
                message: "No existe el usuario"
            })

        } else {

            let date = Date()
            let strTime = date.toLocaleString("en-US", { timeZone: "America/Bogota" });

            const d = new Date(strTime);



            //console.log("consentimientos",consents.length)




            //console.log(permisosAux)








            let consents = await ConsentModel.find({ userId: userId, enterpriseId: enterpriseId })



            let send_1 = []



            let arrayPermisos = []


            let arrayPermisosAux = []

            let arrayPermisosAux2 = []

            let dataPermisos = []




            let send = []

            let contador = 0

            let contador2 = 0

            let permiso;

            let nombrePermiso = []

            let send_3 = []

            let consenToJason = []

            for (var i = 0; i < consents.length; i++) {

                let dataAux = []
                for (var l = 0; l < consents[i].data.length; l++) {
                    dataAux[l] = {
                        tipo: consents[i].data[l].tipo,
                        valor: consents[i].data[l].valor
                    }
                }

                //console.log("este es la data", dataAux)

                let permisosAux = []

                for (var l = 0; l < consents[i].permisos.length; l++) {
                    permisosAux[l] = {
                        tipo: consents[i].permisos[l].tipo,
                        valor: consents[i].permisos[l].valor,
                        descripcion: consents[i].permisos[l].descripcion,
                        data: consents[i].permisos[l].data

                    }
                }

                //console.log(permisosAux)


                const empresa = await EnterpriseModel.findById(consents[i].empresa.id)
                //console.log(empresa)
                consenToJason[i] = {
                    nameEmpresa: empresa.name,
                    emailEmpresa: empresa.email,
                    data: dataAux,
                    permisos: permisosAux,
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
                    contador2 = contador2 + 1



                }

                //console.log("hola",arrayPermisosAux2)

                for (var n = 0; n < arrayPermisosAux.length; n++) {

                    send_1[n] = {

                        send: send,
                        permisos: arrayPermisosAux[n],
                        tratamientos: arrayPermisosAux2[n]

                    }


                }


                send = []

                contador2 = 0

                send_3[i] = { send_1 }


                arrayPermisosAux = []
                arrayPermisosAux2 = []

                send_1 = []

            }













            if (consents.length > 0) {



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

                } else if (type === "json") {



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
            } else {
                res.status(400).send({
                    status: true,
                    message: "No existen usuarios"
                })
            }
        }




    }

}



UserCtrl.cifrado = async (req, res) => {

   let llave = generarLlave("643ff86479afdff8758472d0")

   console.log(llave)

   let cifrado = cifradoA(llave,"prueba")


   console.log(cifrado)


  let decifrado = decifradoA(llave, cifrado)

   console.log(decifrado)
   



}





module.exports = UserCtrl;



