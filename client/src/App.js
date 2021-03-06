import React, { useEffect, useState } from 'react';
import Lottery from './contracts/Lottery.json';
import { getWeb3 } from './utils.js';

const states = ['IDLE', 'BETTING'];

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [bet, setBet] = useState(undefined);
  const [players, setPlayers] = useState([]);
  const [houseFee, setHouseFee] = useState(undefined);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Lottery.networks[networkId];
      const contract = new web3.eth.Contract(
        Lottery.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const [houseFee, state] = await Promise.all([
        contract.methods.houseFee().call(),
        contract.methods.currentState().call()
      ]);

      setWeb3(web3);
      setAccounts(accounts);
      setContract(contract);
      setHouseFee(houseFee);
      setBet({state: 0});
    }
    init();
    window.ethereum.on('accountsChanged', accounts => {
      setAccounts(accounts);
    });
  }, []);

  const isReady = () => {
    return (
      typeof contract !== 'undefined' 
      && typeof web3 !== 'undefined'
      && typeof accounts !== 'undefined'
      && typeof houseFee !== 'undefined'
    );
  }

  useEffect(() => {
    if(isReady()) {
      updateBet();
      updatePlayers();
      updateWinners();
    }
  }, [accounts, contract, web3, houseFee]);

  async function updateBet() {
    const bet = await Promise.all([
      await contract.methods.betCount().call(),
      await contract.methods.betSize().call(),
      await contract.methods.admin().call(),
      await contract.methods.currentState().call()
    ])
    setBet({count: bet[0], size: bet[1], admin: bet[2], state: parseInt(bet[3])});
  }

  async function updatePlayers() {
    const players = await contract.methods.getPlayers().call();
    setPlayers(players);
  }

  async function updateWinners() {
    const winners = await contract.getPastEvents('LottoEnded', {fromBlock: 0});
    let newWinners = [];
    for(let i=0; i<winners.length; i++){
      newWinners.push([
         winners[i].returnValues.winner,
         winners[i].returnValues.prize,
         winners[i].returnValues.players
        ]);
    }
    setWinners(newWinners);
  }

  async function createBet(e) {
    e.preventDefault();
    const betCount = e.target.elements[0].value;
    const betSize = e.target.elements[1].value;
    await contract.methods.createBet(betCount, betSize).send({from: accounts[0]});
    await updateBet();
    await updatePlayers();

    
  };

  async function cancel() {
    await contract.methods.cancel().send({from: accounts[0]});
    await updateBet();
  };

  async function doBet() {
    
    await contract.methods.bet().send({from: accounts[0], value: bet.size});
    await updateBet();
    await updatePlayers();
    await updateWinners();
  };

  if(!bet || typeof bet.state === 'undefined') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container text-center">
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          
        <ul className="navbar-nav px-3">
          <li className = "nav-item text-nowrap d-none d-sm-none d-sm-block">
            <small className="text-secondary">
              <small id="account" className="text-white text-right">Current Account: {accounts[0]}</small>
            </small>
          </li>
        </ul>
      </nav>
      <h1 className="text-center mt-5">Lottery</h1>

      <p>House Fee: {houseFee}% of Bet</p>
      <p>State of Bet: <b>{states[bet.state]}</b></p>
      {bet.state === 1 ? (
        <>
          <p>Bet Size: {bet.size} Wei</p>
          <p>Player Count: {bet.count}</p>
          <div>
            <h2>Players in Bet</h2>
            <ul>
              {players.map(player => <li key={player}>{player}</li>)}
            </ul>
          </div>
        </>
      ) : null}

      {bet.state === 0  ? (
        <div className="row">
          <div className="col-sm-12">
            <h2>Create bet</h2>
            <form onSubmit={e => createBet(e)}>
              <div className="form-group">
                <label htmlFor="count">Player Count</label>
                <input type="text" className="form-control" id="count" />
              </div>
              <div className="form-group">
                <label htmlFor="size">Bet Size (Wei)</label>
                <input type="text" className="form-control" id="size" />
              </div>
              <button type="submit" className="btn btn-primary">Submit</button>
            </form>
          </div>
        </div>
      ) : null}

        {bet.state === 1 ? (
            <div className="row text-center">
              <div className="col-sm-12">
                <h2>Bet</h2>
                  <button 
                    onClick={e => doBet()}
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Bet
                  </button>
              </div>
            </div>
          ) : null}

      {bet.state === 1 
       && accounts[0].toLowerCase() === bet.admin.toLowerCase() ? (
        <div className="row">
          <div className="col-sm-12">
            <h2>Cancel bet</h2>
              <button 
                onClick={e => cancel()}
                type="submit" 
                className="btn btn-primary"
              >
                Cancel
              </button>
          </div>
        </div>
      ) : null}

      
      <p><b>Past Winners of Bets</b></p>
        <ol>
              {winners.map(winner => <li key={winner}><b>Winner</b> : {winner[0]}
               <p>Prize: {winner[1]} Wei</p>
               <p>Number of Players: {winner[2]}</p></li>)}
        </ol>
    </div>
  );
}

export default App;
