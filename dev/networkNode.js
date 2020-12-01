const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const uuid = require("uuid");
const rp = require("request-promise");
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

app.post("/register-and-broadcast-node", function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
    bitcoin.networkNodes.push(newNodeUrl);

  const regNodesPromise = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true,
    };

    regNodesPromise.push(rp(requestOptions));
  });

  Promise.all(regNodesPromise)
    .then((data) => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + "/register-nodes-bulk",
        method: "POST",
        body: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
        },
        json: true,
      };
      return rp(bulkRegisterOptions);
    })
    .then((data) => {
      res.json({ note: "new node registered with network successfully" });
    });
});

app.post("/register-node", function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (
    bitcoin.networkNodes.indexOf(newNodeUrl) == -1 &&
    bitcoin.currentNodeUrl !== newNodeUrl
  )
    bitcoin.networkNodes.push(newNodeUrl);
  res.json({ note: "new node registered successfully." });
});

app.post("/register-nodes-bulk", function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    if (
      bitcoin.currentNodeUrl !== networkNodeUrl &&
      bitcoin.networkNodes.indexOf(networkNodeUrl) == -1
    )
      bitcoin.networkNodes.push(networkNodeUrl);
  });

  res.json({ note: "bulk registeration successful." });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
