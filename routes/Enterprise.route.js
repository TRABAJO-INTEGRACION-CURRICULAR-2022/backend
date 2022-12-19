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



router.get("/getUserConsent/:id", enterpriseCtrl.getUserConsent)





module.exports = router