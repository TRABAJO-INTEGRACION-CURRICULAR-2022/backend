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
    data:[{tipo: {type: String},valor:{type:String}}],
    permisos: [{
        tipo: {type: String}, 
        valor: {type:Boolean},
        descripcion:{type:String},
        data:[{type:String}],
      
        }],
    fechaFin:{type:String},
    obsevaciones: { type: String},
    respondido:{type: Boolean, default: false},
    fechaEnvio: {type: String}
    
});



module.exports = mongoose.model('email', EmailSchema);