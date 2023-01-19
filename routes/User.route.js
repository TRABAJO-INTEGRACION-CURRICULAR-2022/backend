const express = require('express');
const UserCtrl = require('../controller/User.controller');
const router = express.Router()
const userCtrl = require ('../controller/User.controller');
const authToken = require("../middleware/authenticateToken")







//crear un usuario
router.post('/create',  userCtrl.createUser)

//actualizar un usuario
router.put('/update/:id', userCtrl.updateUser)

//Login

router.post('/login', userCtrl.login)

//obtener todos los mails
router.get('/emails/:id',authToken, userCtrl.getEmails)

//obtener email

router.get('/email/:id', userCtrl.getEmail)

//aceptar todos los permios
router.put('/aceptAll/:id',userCtrl.acceptAllConsent)


//rechazar todos lso permisos
router.put('/rejectAll/:id',userCtrl.rejectAllConsent)



//aceptarConsentimiento

router.put('/aceptConsent/:id', userCtrl.acceptConsent)

//obtener empresas con consentimeinto

router.get('/getTreatmentsEnterprises/:id', userCtrl.getEnterprisestreatments)

//Obtener todos los datos de un tratamiento

router.get('/getTreatmentEnterprise/:id', userCtrl.getEnterprisetreatment)

//Exportar data por usuario y por empresa


router.get("/exportAllEnterpriseAndUser/:enterpriseId/:userId/:type",UserCtrl.exportAllEnterpriseAndUser)

//borrar consentimeinto


router.delete("/deleteConsent/:id",UserCtrl.deleteConsent)


//Editar Tratameinto

router.put("/updateTreatmente/:id",UserCtrl.updateTreatmente)


//Actualizar data


router.put("/updateData/:id", UserCtrl.updateData)


//getUsers

router.get("/getUserbyId/:id", userCtrl.getUserbyId)



module.exports = router