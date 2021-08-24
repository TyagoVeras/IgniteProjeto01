const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();

//fazendo com a aplicação reconheça o retorno em json
app.use(express.json());

const custumers = [];

function verifyExistCustomer(req, res, next){

  const {cpf} = req.headers;

  const custumer = custumers.find(custumer => custumer.cpf === cpf);
  
  if(!custumer)
    return res.status(400).json({error: "acount not found"});

  req.custumer = custumer;
  return next();
}

function getBalanceFC(statement){

  const balance = statement.reduce((acc, current)=>{
    if(current.type == 'credit')
      return acc + current.amount
    else 
      return acc - current.amount
  },0);
  return balance;
}

app.post('/acounts', (req, res)=>{

  const {name, cpf} = req.body;
  
  const cpfAlreadyExist = custumers.some((custumer)=> custumer.cpf == cpf);

  if(cpfAlreadyExist){
    return res.status(400).json({error: "cpf already exists"});
  }

  custumers.push(
    {
      name: name,
      cpf: cpf,
      id: uuidv4(),
      statement: [],
    }
  );

  return res.status(201).json(custumers);

});

app.get('/statement', verifyExistCustomer, (req, res)=>{
  const {custumer} = req; 
 
  return res.json(custumer);
});

app.post('/deposit', verifyExistCustomer, (req, res)=>{

  const {description, amount} = req.body;
  const {custumer} = req;


  const statementOpration = {
    description,
    amount,
    created_at: new Date(),
    type:'credit'
  };
  custumer.statement.push(statementOpration);

  return res.status(201).json(custumer);
});

app.post('/withdraw', verifyExistCustomer, (req, res)=>{

  const {amount} = req.body;

  const getBalance = getBalanceFC(req.custumer.statement);

  if(getBalance < amount)
    return res.status(400).json({error: 'Insufficient saldo'})
  
  const statementOperation = {
    description: 'saque',
    amount,
    created_at: new Date(),
    type: 'debit'
  }
  req.custumer.statement.push(statementOperation);

  return res.status(200).json(req.custumer);
});

app.listen('3333');
