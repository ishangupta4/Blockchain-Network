const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const uuid = require("uuid");
const port = process.argv[2];

const nodeAddress = uuid.v1().split("-").join("");
const bitcoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", function (req, res) {
  res.send(bitcoin);
});

app.post("/transaction", function (req, res) {
  const blockIndex = bitcoin.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  res.json({ note: `Transaction will be added to ${blockIndex}.` });
});

app.get("/mine", function (req, res) {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock["index"] + 1,
  };
  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  bitcoin.createNewTransaction(12.5, "00", nodeAddress);
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
  res.json({ block: newBlock });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
