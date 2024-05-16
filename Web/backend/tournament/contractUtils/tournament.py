from web3 import Web3, HTTPProvider
import json
from dotenv import load_dotenv
import os

load_dotenv()

def callFillContract(w3, abi, chainID, wallet, private_key, nounce, address, tournamentData):
    contract = w3.eth.contract(address = address, abi = abi)
    
    try:
        setData = contract.functions.fillContract(tournamentData).build_transaction({
            "gasPrice": w3.eth.gas_price,
            "chainId": chainID,
            "from": wallet,
            "nonce": nounce + 1,
        })
        
        signedTransaction = w3.eth.account.sign_transaction(setData, private_key)
        transactionHash = w3.eth.send_raw_transaction(signedTransaction.rawTransaction)
        transactionReceipt = w3.eth.wait_for_transaction_receipt(transactionHash)
    except:
        print("Not enough gaz")



def deployContract(tournamentData):
    local_dir = os.path.dirname(__file__)
    with open(os.path.join(local_dir, "compiledSolidity.json"), "r") as file:
        compiledSolidity = json.load(file)
    
    provider_url = "https://sepolia.infura.io/v3/2dc50a5c22934a019f88758e28ba4bfc"
    w3 = Web3(HTTPProvider(provider_url))

    abi = compiledSolidity["contracts"]["tournament.sol"]["Tournament"]["abi"]
    bytecode = compiledSolidity["contracts"]["tournament.sol"]["Tournament"]["evm"]["bytecode"]["object"]
    
    tournamentContract = w3.eth.contract(abi = abi, bytecode = bytecode)

    chainID = 11155111
    wallet = os.environ.get("WALLET")
    private_key = os.environ.get("PRIVATE_KEY")
    nounce = w3.eth.get_transaction_count(wallet)

    contractAddress = "0x0"
    try:
        transaction = tournamentContract.constructor().build_transaction({
            "gasPrice": w3.eth.gas_price,
            "chainId": chainID,
            "from": wallet,
            "nonce": nounce,
        })
        
        
        signedTransaction = w3.eth.account.sign_transaction(transaction, private_key)
        transactionHash = w3.eth.send_raw_transaction(signedTransaction.rawTransaction)
        transactionReceipt = w3.eth.wait_for_transaction_receipt(transactionHash)
        
        contractAddress = transactionReceipt.contractAddress
    except:
        return "0x0"

    callFillContract(w3, abi, chainID, wallet, private_key, nounce, contractAddress, tournamentData)
    
    return contractAddress
