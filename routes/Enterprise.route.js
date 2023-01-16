const express = require('express');
const router = express.Router()
const enterpriseCtrl = require ('../controller/Enterprise.controller');






//crear empresa
router.post('/create',  enterpriseCtrl.createEnterprise)

//login

router.post('/login', enterpriseCtrl.login)


//actualizar empresa
router.put('/update/:id', enterpriseCtrl.updateEnterprise)


//crear email para un usuario
router.post('/createEmail/:id', enterpriseCtrl.sendEmail)


//obtener usuarios
router.get("/getUsers/:id", enterpriseCtrl.getUsers)


//Obtener usuario
router.get("/getUserConsent/:id", enterpriseCtrl.getUserConsent)

//crear tratamiento
router.post("/createTreatment/:id", enterpriseCtrl.createTreatment)

//Actualizar tratamiento

router.put("/updateTreatment/:id", enterpriseCtrl.updateTreatment)

//Obtener tratamientos

router.get("/getTreatments/:id", enterpriseCtrl.getTreatments)

//Obtener tratamiento
router.get("/getTreatment/:id", enterpriseCtrl.getTreatment)

//descargar historial

router.get("/exportData/:enterpriseId/:userId/:type", enterpriseCtrl.exportDatabyUser)

router.get("/exportDatabyTreatment/:enterpriseId/:treatment/:type", enterpriseCtrl.exportDatabyTreatment)

//Filtrar usuarios por tratamiento
router.get("/getUsersByTreatment/:enterpriseId/:treatment", enterpriseCtrl.getUsersByTreatment)

//Exportar todo empresa

router.get("/exportAllEnterprise/:enterpriseId/:type", enterpriseCtrl.exportAllEnterprise)

//Obtener blockchain


router.get("/getBlockChain/:enterpriseId/:userId", enterpriseCtrl.getBlockChain)

//Obtener correos no respondidos

router.get("/getEmailsDoesntAnswered/:id", enterpriseCtrl.getEmailsDoesntAnswered)



module.exports = router