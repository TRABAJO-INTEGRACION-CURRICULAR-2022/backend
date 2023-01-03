const mongoose = require('mongoose');
const { Schema } = mongoose;


const TreatmentSchema = new Schema({
    name: { type: String, require: [true, 'Nombre requerido'] },
    data: [{
        value: {type: String}, 
        label: {type:String},
        }],

    description: {type: String},
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'enterprise'},
    
    
});





module.exports = mongoose.model('treatment', TreatmentSchema);