const EnterpriseCtrl = {};
const EnterpriseModel = require('../model/Enterprise.model');
const EmailModel = require('../model/Email.model')
const UserModal = require("../model/User.model")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BlockchainModal = require('../model/Blockchain.modal');
const ConsentModel = require('../model/Consent.model');







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

    let { email, descripcionConsentimeinto, permisos ,data, fechaFin, observaciones } = req.body;

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
                    data:data,
                    descripcionConcentimiento: descripcionConsentimeinto,
                    permisos: permisos,
                    fechaFin: fechaFin,
                    obsevaciones: observaciones,
                    fechaEnvio: strTime



                })

                await NewEmail.save()

                res.json({
                    status:"Email Enviado"
                })

            } catch (error) {
                console.log(error)

                res.json({
                    status:"Error al envíar correo"
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

EnterpriseCtrl.getUsers = async(req,res)=>{

    console.log(req.params.id)
    
    let users = await ConsentModel.find({"empresa.id" :req.params.id})

    if(users.length > 0) {

        res.send(users)

    }else{
        res.send({
            status:"No existen consentimeintos"
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

EnterpriseCtrl.getUserConsent = async(req,res)=>{

    let id = req.params.id

    let consent = await ConsentModel.findById(id)


    if(consent){
        res.status(200).send({
            status: true,
            consent: consent,
            message:"ok"
        })
    }else{
        res.status(404).send({
            status: false,
            message: "No existe el consentimiento"
        })
    }

}

//Obtener usuarios con consentimiento

EnterpriseCtrl.getUsers = async(req,res)=>{

    let id = req.params.id

    let enterprise = await EnterpriseModel.findById(id)

    if(enterprise){
        let usersSend  = []
        let users = await ConsentModel.find({"empresa.id":id})

        for(var i = 0; i < users.length; i++){

            let user = await UserModal.findById(users[i].usuario.id)
            usersSend[i] = {
                id_consent: users[i]._id,
                id_user: user._id,
                fechaFinConsentimeinto : users[i].fechaFinConsentimeinto,
                name: user.name,
                lastname: user.lastName
            }
        }

        if(users.length > 0){
            res.send(usersSend)
        }else{
            res.send({
                status:"No hay usuarios"
            })
        }
        
    }else{
        res.send({
            status:"No existe la empresa"
        })
    }

    

    
}







module.exports = EnterpriseCtrl;