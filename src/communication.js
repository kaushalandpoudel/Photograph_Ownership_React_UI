import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import web3 from './web3';
import photographOwnership from './contract';
import ipfs from './ipfs';
import CID from 'cids';
import fs from 'fs';
import { nodeInternals } from 'stack-utils';
import * as JsEncryptModule from 'jsencrypt';
import { log } from 'util';

class Communication extends Component {
  state={
    account:'',
    title: '',
    verifier: '',
    searchTitle: '',
    searchOwnerAddress: '',
    searchIpfsHash: '',
    searchResult: [],

    messages : [],
    //copy

    searchBase64Data: '',
    tempData: '',
    url: '',
    payableValue: '',
    payableIndex: '',
    payableIPFS: '',
    payableUser: '',
    payableReceipt: '',
    authorizationIndex: '',
    authorizationUser: '',
    authorizationIPFS: '',
    authorizationOwner: '',
    authorizationValue: '',
    authorizationReceipt: '',
    urlOriginal: '',
    searching:''



  }

  handleClick = async () => {
    var generatedSymKey= await web3.shh.generateSymKeyFromPassword('hello');    
    var symKey= await web3.shh.getSymKey(generatedSymKey);    
    var symKeyID= await web3.shh.addSymKey(symKey)



    
    var publicKey = "-----BEGIN PUBLIC KEY-----"+
                    "MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgG/BC0TEkEZKJp/foPUsdaPZ7WG3"+
                    "DPlJtrGZQX0m2FFiJP59KhkWlrRXxRjOYV+RBrIUePrYdu0SbYp6QTY3WEc1UED7"+
                    "/UDMmmI0tW3t3CGVVWxrSuKFa61KZMh/8IF4nl+vLLpz4p/XYeaXVVNsaMQXBapT"+
                    "2Hzyy0TwuA8EhPENAgMBAAE="+
                    "-----END PUBLIC KEY-----";
    var encrypt = new JsEncryptModule.JSEncrypt();
    

    encrypt.setPublicKey(publicKey);
    var ciphertext = encrypt.encrypt("node2: " + this.state.title);
    

    var posting = await web3.shh.post({
      symKeyID: symKeyID, //symKeyID of the sender
      ttl: 10,
      topic: '0x07678231',
      powTarget: 2.01,
      powTime: 2,
      payload: web3.utils.fromAscii(ciphertext),
      });


    this.setState(prevState => ({
      messages: [...prevState.messages, "node2: " + this.state.title]
    }));

    this.setState({title: ''});
  };

  endChat = async () => {
    this.setState({messages: []});
  };


  //from here

  searchHandler = async event => {
    event.preventDefault();
    this.setState({searching: 'Searching..Please Wait!'});
    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];
    await web3.eth.personal.unlockAccount(accounts[0], '1234');

    const length = await photographOwnership.methods.getPhotographsLength().call({
      from: accounts[0],
      gas:3000000
    });

    console.log(length);
    
    var tempSearchResult = new Array();
    for(var i=0; i<length; i++){

     var obj = await this.getPhoto(i); 
     if(obj[0] == this.state.searchTitle || obj[1] == this.state.searchIpfsHash || obj[2] == this.state.searchOwnerAddress){
      tempSearchResult.push(obj);
     }
    console.log(obj); 
      
    };
    this.setState({searching: ''});
    // console.log(tempSearchResult[0][0]);
    this.setState({searchResult: tempSearchResult});
    

    // this.setState({searchResult: tempSearchResult});
    console.log(this.state.searchResult);


  };

  getPhoto= async (i) =>{
    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];
    await web3.eth.personal.unlockAccount(accounts[0], '1234');
    const object = await photographOwnership.methods.getPhotograph(i).call({
      from: accounts[0],
      gas:3000000
    });

    return object;
  }

  retrieveImage = async (hash) =>{
    console.log(hash);
    this.getPhotoPreview(hash[1]);
    
  }

  convertToGetable = (data) =>{
    var tempData = [];
    for(var i = 0; i< data.length; i++){
      if(data[i] === '/'){
        tempData = tempData +'`';
      }else{
        tempData = tempData+ data[i];
      }
    }
    this.setState({tempData});
    this.setState({url: 'http://127.0.0.1:8081/'+ this.state.tempData});
    console.log(tempData);
  };

  getPhotoPreview = async (hash) => {
    const cidHash = new CID(hash);
    console.log(cidHash);
    var data;
    await ipfs.get(cidHash.toV1(), (err, files) => {
      if(err){
        console.log(err);
        return;
      }
      console.log(files[0].path);
      data =  files[0].content.toString('base64');
      console.log(data);
      
      this.setState({searchBase64Data : files[0].content.toString('base64')});
      this.convertToGetable(data);
      
    });
    
  };

  makePayable= async event =>{
    this.setState({payableReceipt: 'Transaction is executing. Please wait!'});
    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];
    await web3.eth.personal.unlockAccount(accounts[0], '1234');

    const object = await photographOwnership.methods.makePayable(this.state.payableIPFS, this.state.payableValue, this.state.payableUser).send({
      from: accounts[0],
      gas:3000000
    });

    this.setState({payableReceipt: 'The transaction id is: '+ object.transactionHash});

    
    

  };


  createAuthorizationContract= async event =>{
    this.setState({authorizationReceipt: 'Transaction is executing. Please wait!'});
    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];
    await web3.eth.personal.unlockAccount(accounts[0], '1234');

    const object = await photographOwnership.methods.createAuthorizationContract(this.state.authorizationIPFS, this.state.authorizationOwner).send({
      from: accounts[0],
      gas:3000000,
      value: (this.state.authorizationValue),
    });
    console.log(object);

    const authReceipt = await photographOwnership.methods.getAuthorizationReceipt(this.state.authorizationIPFS).call({
      from: accounts[0]
    });
    console.log(authReceipt);
    // const authContract = await authReceipt.methods.getAuthorizationContract().call({
    //   from: accounts[0]
    // });

    // console.log(authContract);
    
    
    this.setState({authorizationReceipt: 'The transaction id is: '+ object.transactionHash});

    const tempIndex = await photographOwnership.methods.getIndex(this.state.authorizationIPFS).call({
      from: accounts[0],
      gas:3000000
    })

    const object1 = await photographOwnership.methods.getPhotograph(tempIndex).call({
      from: accounts[0],
      gas:3000000
    });

    if(object1[5] == false){
      this.getPhotoPreview1(object1[1]);
    }else{
      this.setState({authorizationReceipt: 'Transaction failed!'});
    }

  }

  convertToGetable1 = (data) =>{
    var tempData = [];
    for(var i = 0; i< data.length; i++){
      if(data[i] === '/'){
        tempData = tempData +'`';
      }else{
        tempData = tempData+ data[i];
      }
    }
    this.setState({tempData});
    this.setState({urlOriginal: 'http://127.0.0.1:8081/original/'+ this.state.tempData});
    console.log(tempData);
  };

  getPhotoPreview1 = async (hash) => {
    const cidHash = new CID(hash);
    console.log(cidHash);
    var data;
    await ipfs.get(cidHash.toV1(), (err, files) => {
      if(err){
        console.log(err);
        return;
      }
      console.log(files[0].path);
      data =  files[0].content.toString('base64');
      console.log(data);
      
      this.setState({searchBase64Data : files[0].content.toString('base64')});
      this.convertToGetable1(data);
      
    });
    
  };

  





  
  async componentDidMount(){

    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];
    const verifier = accounts;
    console.log(await web3.eth.personal.unlockAccount(accounts[0], '1234'));

    this.setState({verifier});

    var pub1= "0x6a552b0bbc39e1c9a9e5045f5fe44e692a360e47e68e138d88948a9c72927d46";

    var privateKey = "-----BEGIN RSA PRIVATE KEY-----"+
                    "MIICWgIBAAKBgF35iR/2bNQGe0bsiG2Em41M1cjoHyUGnfAvQ9zEmiASo+K0AQQx"+
                    "xXbWa7L72DGazOjuXMFs5nvM4MLbs18+YlTURa6L+hgAGnVJ4gMe8np/y3JB6G0G"+
                    "22JKn1FmY+oB4GVT6CJqcBcfeGK+AWsTmXFY7mqGFg/omsEVRayDINqBAgMBAAEC"+
                    "gYAsqqTAqnJDvOjvZxHZbEQ7PyAGJD5ZbPG47d5FmrTfNbzrzj8FbVq8B2KdahLy"+
                    "UO/AbztrPIW4pkLWm3KAfLhjoadmxOkoO82CV0dXZKxjBJQl8BzBYk5oNC85nuDz"+
                    "Al+8lYvtL01+rXx90X5zT3cHhJ+H/umyJbMByLOYAU6WGQJBAKhph6I3IbnH3V4H"+
                    "yzniP+5Qswf8H7WVr99TMhHVuE94r9Otd0JUiA2zKMK4wqL3GiLX+zI/gyd6wcDi"+
                    "tfHNhrMCQQCO2V7o+SThiRiUnAyzBAkNpfzHeCYTGCWeTgfXb3VnoP/Eb9XADvPA"+
                    "f462XOrtPLi3TbTAhPdd/IPYCEsHJ5P7AkB+lwR67JIPQaql+ZnLIsQHcOWCBQQY"+
                    "zDFs3u5t9YYbRo5zwJo6Y6v5EEh9RcAYG0GsG0kYViFR1bY6NK+q2GB9AkAT+Opf"+
                    "Mm5opi1socDYyqilYt7L2M2h/89KqehIw8mreoQoJ+a/2pdUA8GlV6p1DvdYkaHD"+
                    "BRQ87NBWRRqQXoU/AkBml18mwY9cBYTq7r4v/T5dsWP7l6NWZZRZvktF+Zv0o6bx"+
                    "ug0DhDQ+rdt5UQJ7gzzMEGOw4M5PWBeis9mBQyN6"+
                    "-----END RSA PRIVATE KEY-----"

    var generatedSymKey= await web3.shh.generateSymKeyFromPassword('hello');    
    var symKey= await web3.shh.getSymKey(generatedSymKey);    
    var symKeyID= await web3.shh.addSymKey(symKey)
    

    web3.shh.newMessageFilter({symKeyID: symKeyID, topic: '0x07678231'}).then(filterId => {
      setInterval(() => {
        web3.shh.getFilterMessages(filterId).then(messages => {
          for (let msg of messages) {
            let message = web3.utils.toUtf8(msg.payload);
            
            var decrypt = new JsEncryptModule.JSEncrypt();
            decrypt.setPrivateKey(privateKey);
            var plaintext = decrypt.decrypt(message);
            
            this.setState(prevState => ({
              messages: [...prevState.messages, plaintext]
            }))

            
          }
        });
      }, 1000);
    });

};


  render() {
    return (
      <div align='center'>
        <h1>This is node 2</h1>
        <hr/>
          <p className="App-title" align="center"> Current Account: {this.state.verifier[0]}</p>
        <hr/>

        <div align='center'>

        <h3 align='center'>Image Search</h3>
          <form align='center'>
            <input placeholder='Title' value={this.state.searchTitle} onChange={event => this.setState({searchTitle: event.target.value})}></input> &nbsp;&nbsp;
            <input placeholder='Owner Address' value={this.state.searchOwnerAddress} onChange={event => this.setState({searchOwnerAddress: event.target.value})}></input> 
            <br/>
            <input placeholder = 'IPFS Hash' value={this.state.searchIpfsHash} onChange={event => this.setState({searchIpfsHash: event.target.value})}></input> 
            <br/>
            <button type='search' onClick={this.searchHandler}>Search</button>

          </form>
        </div>

        {this.state.searchResult.map((details, index) => {
          return (
            <div>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Photograph ID</th>
                  <th>Owner Address</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                <td>{details[0]}</td>
                <td>{details[1]}</td>
                <td>{details[2]}</td>
                <td>
                  <button type="submit" onClick={() => this.retrieveImage(details)}>Preview</button>
                </td>
                <td>
                  <button type="submit">Communicate</button>
                </td>
                </tr>
              </tbody>
            </table>

            
            </div>
          

        )})}
        {/* <a target="_blank" download="custom-filename" href={this.state.url} > */}
        <img align = "center"  src = {this.state.url} />
        {/* download */}
        {/* </a> */}

        <hr/>
        <h3>Communicate</h3>
        {this.state.messages.map(msg => (
          <div>{msg}</div>
        ))}
        <br/>
        <input type='text' placeholder='message' value={this.state.title} onChange={event => this.setState({title: event.target.value})}></input> &nbsp;&nbsp;
        <button onClick={this.handleClick}>Send Message</button>
        <br/>
        <button onClick={this.endChat}>End Chat</button>
        <h3>{this.state.account}</h3>
        <hr/>
        <h3>Make payable</h3>
        <input placeholder='Photograph ID' value={this.state.payableIPFS} onChange={event => this.setState({payableIPFS: event.target.value})}></input> &nbsp;&nbsp;&nbsp;
        <input placeholder='Value' value={this.state.payableValue} onChange={event => this.setState({payableValue: event.target.value})}></input> <br/>
        <input placeholder='User' value={this.state.payableUser} onChange={event => this.setState({payableUser: event.target.value})}></input> <br/>
        <button onClick={this.makePayable}>Make Payable</button>
        <p>{this.state.payableReceipt}</p>
        <hr/>
        <h3>Create Authorization Contract</h3>
        {/* <input placeholder='Index' value={this.state.authorizationIndex} onChange={event => this.setState({authorizationIndex: event.target.value})}></input> &nbsp;&nbsp;&nbsp; */}
        <input placeholder='Photograph ID' value={this.state.authorizationIPFS} onChange={event => this.setState({authorizationIPFS: event.target.value})}></input> &nbsp;&nbsp;&nbsp;
        <input placeholder='Owner Address' value={this.state.authorizationOwner} onChange={event => this.setState({authorizationOwner: event.target.value})}></input> <br/> 
        <input placeholder='Value to Send' value={this.state.authorizationValue} onChange={event => this.setState({authorizationValue: event.target.value})}></input> <br/>

        <button onClick={this.createAuthorizationContract}>Create Authorization Contract</button>
        <br/>
        <p>{this.state.authorizationReceipt}</p>

        <img align = "center"  src = {this.state.urlOriginal} />
        

        <br/>
        <br/>
      </div>
      
    );
  }
}

export default Communication;
