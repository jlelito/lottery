const path = require("path");
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
 
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },

    ropsten: {
      provider: function(){
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`
          )
      },
      gasPrice: 250000000000,
      network_id: 3
    },

  },


  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  
  
  compilers: {
    solc: {
      version: '0.5.4'
    }
  }
};
