const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConsetSchema = new Schema({

    empresa: { 
        id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'enterprise'},
        name:{type:String, required: true} 
    },
    usuario: { 
        id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
        name:{type: String }
    },
    permisos: [{tipo: {type: String}, valor: {type:Boolean}}],
    fechaModificacion: {type: String},
    fechaFinConsentimeinto: {type: String}
    
});

module.exports = mongoose.model('conset', ConsetSchema);
