const express = require('express');
const UserCtrl = require('../controller/User.controller');
const router = express.Router()
const userCtrl = require ('../controller/User.controller');






//crear un usuario
router.post('/create',  userCtrl.createUser)

//actualizar un usuario
router.put('/update/:id', userCtrl.updateUser)

//Login

router.post('/login', userCtrl.login)

//obtener todos los mails
router.get('/emails/:id', userCtrl.getEmails)

//aceptar todos los permios
router.put('/aceptAll/:id',userCtrl.acceptAllConsent)

//rechazar todos lso permisos
router.put('/rejectAll/:id',userCtrl.rejectAllConsent)





module.exports = router