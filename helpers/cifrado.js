var assert = require('assert');
var crypto = require('crypto');


const generarLlave = (idEnterprise) =>{

    var llave = (generateRandomString(8)+idEnterprise);


    return llave



}


const cifradoA = (llave, text) => {


    var algorithm = 'aes256';
    var inputEncoding = 'utf8';
    var outputEncoding = 'hex';
    var ivlength = 16  // AES blocksize


    var key = Buffer.from(llave, 'latin1'); // key must be 32 bytes for aes256
    var iv = crypto.randomBytes(ivlength);

    var text = text

    console.log('Ciphering "%s" with key "%s" using %s', text, key, algorithm);

    var cipher = crypto.createCipheriv(algorithm, key, iv);
    var ciphered = cipher.update(text, inputEncoding, outputEncoding);
    ciphered += cipher.final(outputEncoding);
    var ciphertext = iv.toString(outputEncoding) + ':' + ciphered

    return ciphertext


   


}


const decifradoA = ( key,ciphertext) =>{

    var algorithm = 'aes256';
    var inputEncoding = 'utf8';
    var outputEncoding = 'hex';



    var components = ciphertext.split(':');
    var iv_from_ciphertext = Buffer.from(components.shift(), outputEncoding);
    var decipher = crypto.createDecipheriv(algorithm, key, iv_from_ciphertext);
    var deciphered = decipher.update(components.join(':'), outputEncoding, inputEncoding);
    deciphered += decipher.final(inputEncoding);

   
   

    return deciphered


}


const  generateRandomString = (num) => {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result1= Math.random().toString(36).substring(0,num);       

    return result1;
}



module.exports = {generarLlave, cifradoA, decifradoA}