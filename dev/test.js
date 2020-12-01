const Blockchain = require("./blockchain");

const bitcoin = new Blockchain();

const previousHash = "AASDFG325423523";
const nonce = 392;
const currentBlockData = [
  {
    amount: 100,
    sender: "sdfssfs90434",
    recipient: "asdfasdf9124",
  },
];

console.log(bitcoin.hashBlock(previousHash, currentBlockData, nonce));
