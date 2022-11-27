const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://tesis:Tesis123@cluster0.gzew6uq.mongodb.net/?retryWrites=true&w=majority');



const objetobd = mongoose.connection

objetobd.on('connected', ()=>{
    console.log("conexión correcta a Mongo db")
})


objetobd.on('error', ()=>{
    console.log("error en la conexión de mongo db")
})

module.exports = mongoose