const cron = require('node-cron')
const ConsentModel = require('../model/Consent.model')
var XLSX = require('xlsx');
const fs= require("fs")

cron.schedule('* 23 * * *', async () => {

    let consents = await ConsentModel.find()

   

    const tiempoTranscurrido = Date.now();
    const today = new Date(tiempoTranscurrido);


    for(var i = 0; i < consents.length;i++){
        let date = consents[i].fechaFinConsentimeinto
        let dateWithFormat = new Date(date)

        if(today.getDay()=== dateWithFormat.getDay()){
            await ConsentModel.findByIdAndDelete(consents[i]._id, { userFindAndModify: false });       
        }
    }

    

    

    
})