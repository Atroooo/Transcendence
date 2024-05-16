from web3 import Web3, HTTPProvider
import json
from dotenv import load_dotenv
import os

load_dotenv()

def getWinner(address):
    local_dir = os.path.dirname(__file__)
    with open(os.path.join(local_dir, "compiledSolidity.json"), "r") as file:
        compiledSolidity = json.load(file)
    
    
    provider_url = "https://sepolia.infura.io/v3/2dc50a5c22934a019f88758e28ba4bfc"
    w3 = Web3(HTTPProvider(provider_url))

    abi = compiledSolidity["contracts"]["tournament.sol"]["Tournament"]["abi"]
    bytecode = compiledSolidity["contracts"]["tournament.sol"]["Tournament"]["evm"]["bytecode"]["object"]

    chainID = 11155111
    wallet = os.environ.get("WALLET")
    private_key = os.environ.get("PRIVATE_KEY")
    nounce = w3.eth.get_transaction_count(wallet)
    winner = "default"
    
    try:
        contract = w3.eth.contract(address = address, abi = abi)
    except:
        return winner
    
    try:
        winner = contract.functions.getWinner().call()
    except:
        print("Error: contract not found")
    
    return winner
