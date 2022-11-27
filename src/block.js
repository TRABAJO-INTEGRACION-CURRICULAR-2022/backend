const SHA256 = require("crypto-js/sha256");
const hex2ascii = require("hex2ascii");

class Block {


  constructor(data) {
    this.hashMain = null; //se calcula con todos los datos que tiene el bloque.
    this.hashEnterprise = null //se calcula con los datos de la empresa el nombre y la fecha
    this.previousHashMain = null; //referencia al bloque anterior.
    this.previousHashEnterprise = null,
    this.height = 0; //bloques dentro de la 
    this.heighEnterprise = 0; //bloques dentro de la cadena
    this.body = Buffer.from(JSON.stringify(data).toString("hex")); //datos para encriptarlos lo convertimos en string y en exadecimal
    this.permisos= [{tipo: "", valor: null}],
    this.userId = ""; //idUsuario
    this.enterpriseId =""//idEmpresa
    this.fechaModificacion = ""
    this.time = 0; //Momento en que se genera este bloque.
    
  }
  validate() {
    const self = this; //referencia al bloque

    return new Promise((resolve, reject) => {
      let currentHash = self.hashMain; //obtenemos el hash
      let enterPriseHash = this.enterpriseId + this.fechaModificacion

      self.hashMain = SHA256(JSON.stringify({ ...self, hashMain: null })).toString(); //creamos un hash con sha256

      console.log("lele",self.hashMain)

      self.hashEnterprise = SHA256(JSON.stringify({ enterPriseHash, hashEnterprise: null })).toString();


      if (currentHash !== self.hashMain) { //comprobamos si el hash es distinto pues es false
        return resolve(false);
      }

      resolve(true);
    });
  }

  getBlockData() {
    const self = this;
    return new Promise((resolve, reject) => {
      let encodedData = self.body; //obtenemos el body codificada
      let decodedData = hex2ascii(encodedData); //decodificamos
      let dataObject = JSON.parse(decodedData); //lo convertimos a json

      if (dataObject === "Genesis Block") { // primer bloque, no tiene has previo
        reject(new Error("This is the Genesis Block"));
      }

      resolve(dataObject);
    });
  }

  toString() { //mostramos la ifnormación del bloque.
    const { hashMain, height, body, time, previousHashMain, userId } = this;
    return `Block -
        hash: ${hashMain}
        height: ${height}
        body: ${body}
        time: ${time}
        previousBlockHash: ${previousHashMain}
        userId: ${userId} 
        -------------------------------------`;
  }
}

module.exports = Block;