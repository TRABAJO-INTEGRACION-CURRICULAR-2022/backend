const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlockchainSchema = new Schema({
    hashMain: { type: String, require: [true, 'hashMain'] },
    hashEnterprise:{type:String, require: true},
    previousHashMain: { type: String, require: [true, 'hash'] },
    previousHashEnterprise: { type: String, require: [true, 'hash'] },
    heigh: { type: Number, require: [true, 'heigh'] },
    heighEnterprise: { type: Number, require: [true, 'heigh'] },
    body: { type: String, require: [true, 'body'] },
    body_enterprise:{type: String, require: true},
    data:[{tipo: {type: String},valor:{type:String}}],
    permisos: [{
        tipo: {type: String}, 
        valor: {type:Boolean},
        descripcion:{type:String},
        data:[{type:String}],
        
        }],
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'user' },
    enterpriseId: { type: mongoose.Types.ObjectId, required: true, ref: 'enterprise' },
    fechaModificacion: {type: String},
    fechaFinConsentimeinto:{type: String}
    
});

module.exports = mongoose.model('blockchain', BlockchainSchema);
