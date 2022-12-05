const jwt = require("jsonwebtoken");

const authToken = async(req, res, next) =>{
  const authHeader = req.headers.authorization;

  if(authHeader){
      const token = authHeader.split(" ")[1]

      jwt.verify(token,"secreto", (err, user)=> {
          if(err){
              return res.status(401).json("Token no es valido")
          }

          next();
      })

  }else{
      res.status(401).json("No estas autenticado")
  }
}

module.exports = authToken;