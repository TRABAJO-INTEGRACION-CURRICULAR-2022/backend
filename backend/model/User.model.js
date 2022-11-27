const mongoose = require('mongoose');
const { Schema } = mongoose;


const UserSchema = new Schema({
    name: { type: String, require: [true, 'Nombre requerido'] },
    lastName: { type: String, require: [true, 'Nombre requerido'] },
    email: { type: String, require: [true, 'Email requerido'] },
    ci: { type: String, require: [true, 'Contraseña requerido'] },
    password: { type: String },
    
    
});

UserSchema.methods.setImage = function setImage (filename) {
    this.image = filename
}



module.exports = mongoose.model('user', UserSchema);