const mongoose = require('mongoose');
const { Schema } = mongoose;


const EmailSchema = new Schema({
    empresa: { 
        id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'enterprise'},
        name:{type:String, required: true} 
    },
    usuario: { 
        id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
        name:{type: String }
    },
    descripcionConcentimiento: { type: String},
    permisos: [{tipo: {type: String}, valor: {type:Boolean}}],
    fechaFin:{type:String},
    obsevaciones: { type: String},
    respondido:{type: Boolean, default: false},
    
});



module.exports = mongoose.model('email', EmailSchema);