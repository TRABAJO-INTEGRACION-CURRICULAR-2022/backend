const mongoose = require('mongoose');
const { Schema } = mongoose;


const EnterpriseSchema = new Schema({
    name: { type: String, require: [true, 'Nombre requerido'] },
    email: { type: String, require: [true, 'Email requerido'] },
    ruc: { type: String, require: [true, 'Contraseña requerido'] },
    password: { type: String },
    key:{type:String}
   
    
}, {

    timestamps: true
});

EnterpriseSchema.methods.setImage = function setImage (filename) {
    this.image = filename
}



module.exports = mongoose.model('enterprise', EnterpriseSchema);