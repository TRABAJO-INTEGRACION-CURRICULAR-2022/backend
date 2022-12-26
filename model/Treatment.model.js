const mongoose = require('mongoose');
const { Schema } = mongoose;


const TreatmentSchema = new Schema({
    name: { type: String, require: [true, 'Nombre requerido'] },
    data: [{ type: String, require: true }],
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'enterprise'},
    
    
});





module.exports = mongoose.model('treatment', TreatmentSchema);