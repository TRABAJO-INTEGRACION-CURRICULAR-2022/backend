const SHA256 = require("crypto-js/sha256");
const Block = require("./block");
const BlockChainController = require("../Controllers/BlockChain.controller");


class Blockchain {

  constructor() {
    this.chain = []
    this.height = -1;
    this.initializeChain();
  }

  async initializeChain() {
    if (this.height === -1) { //creamos la cadena
      const block = new Block({ data: "Genesis Block" });
      await this.addBlock(block);
    }
  }

  addBlock(block) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      block.height = self.chain.length; //lingitud que tiene al array.
      block.time = new Date().getTime().toString(); // tiempo de creación.

      if (self.chain.length > 0) { // comprobamos que no sea el  bloque genesis
        block.previousBlockHash = self.chain[self.chain.length - 1].hash; //comprobamos que esten enlazadps
      }

      //Errores
      let errors = await self.validateChain();
      if (errors.length > 0) {
        reject(new Error("The chain is not valid: ", errors));
      }



      block.hash = SHA256(JSON.stringify(block)).toString(); //creamos el hash
      self.chain.push(block); //añadimos a la cadena.
      resolve(block); // deolvemos el bloque
    });
  }

  validateChain() {
    let self = this; //guardamos la referencia.
    const errors = []; //array de errores

    return new Promise(async (resolve, reject) => {
      self.chain.map(async (block) => { //recorremos el aeeeay de bloques
        try {
          let isValid = await block.validate(); //validamos
          if (!isValid) {
            errors.push(new Error(`The block ${block.height} is not valid`)); // si hay errror lo ponemos en los errores
          }
        } catch (err) {
          errors.push(err); 
        }
      });

      resolve(errors);
    });
  }

  print() {
    let self = this;
    for (let block of self.chain) {
      console.log(block.toString());
    }
  }
}

module.exports = Blockchain;