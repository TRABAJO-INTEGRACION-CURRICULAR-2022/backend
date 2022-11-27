const EmailCtrl = {};
const EmailModel = require('../model/Email.model');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');






//Para crear un usuario
EmailCtrl.createEmail = async (req, res) => {
    let { name, email, ruc, password } = req.body

    const emailUser = await EnterpriseModel.findOne({ email: email })

    if (emailUser) {
        res.json({
            status: 'El correo ya existe o inválido'
        })
    }
    else {


        try {

            if(name && email && ruc && password){
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

        }else{
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

EnterpriseCtrl.updateEnterprise = async (req, res) => {
    let { name, email, ruc, password } = req.body

    const empresa = await EnterpriseModel.findById(req.params.id);

    if (empresa) {
        const email2 = await EnterpriseModel.findOne({email:email});
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






module.exports = EnterpriseCtrl;