import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import web3 from './web3';
import photographOwnership from './contract';
import ipfs from './ipfs';
import CID from 'cids';
import fs from 'fs';
import { nodeInternals } from 'stack-utils';


class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      verifier: '',
      title: '',
      searchTitle:'',
      ipfs_address: '',
      owner_address: '',
      searchOwner_address:'',
      amount: '',
      buffer:'',
      ipfsHash:'',
      searchIpfsHash:'',
      base64Data:'',
      searchBase64Data:'',
      linkableBase64Data:'',
      tempData:'',
      addVerificationText:'',
      url:''
    };

    this.searchHandler = this.searchHandler.bind(this);
    this.getPhoto = this.getPhoto.bind(this);
    this.convertToGetable = this.convertToGetable.bind(this);
    this.searchImage = this.searchImage.bind(this);
}

  
  captureFile =(event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => this.convertToBuffer(reader);
  };

  convertToBuffer = async (reader) => {
    //file is converted to a buffer for upload to IPFS

    const buffer = await Buffer.from(reader.result);
    this.setState({base64Data : buffer.toString('base64')});
    
    //set this buffer 
    this.setState({buffer});
  };

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

  getPhoto = async (hash) => {
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

  

  addImage = async() => {

    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];

    const adding = await photographOwnership.methods.addPhotograph(this.state.title,this.state.ipfsHash,this.state.owner_address,this.state.amount).send({
      from: accounts[0],
      gas:3000000
    });

    console.log('transaction hash : ' + adding.transactionHash);
    this.setState({addVerificationText: 'The transaction id is '+ adding.transactionHash});

  };

  searchImage = async()=>{

    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = web3.eth.accounts[0];

    const object = await photographOwnership.methods.getPhotograph(this.state.searchTitle,this.state.searchIpfsHash,this.state.searchOwner_address).call({
      from: accounts[0]
    });

    console.log(object['1']);
    if(object['1'] !== ''){
      this.getPhoto(object['1']);
    }
    
  };

  searchHandler = async event => {
    event.preventDefault();
    this.searchImage();
  };

  handleClick = async event =>{

    event.preventDefault();
    
    await ipfs.add(this.state.buffer, (error, result) => {
      if(error){
        console.log(error);
        return
      }
      this.setState({ipfsHash: result[0].hash});
      console.log('ipfsHash ', this.state.ipfsHash);
      if(this.state.ipfsHash != ''){
        this.setState({ipfsVerificationText: 'The IPFS hash for the image is ' + this.state.ipfsHash});
        this.addImage();
      }

    });

    
    // const cidHash = new CID(this.state.ipfsHash);

    // console.log(cidHash);
    

  
  
    // const tempAddress = await photographOwnership.methods.getVerifier().call();
    
    // await photographOwnership.methods.addVerifier('0x7D1266D7b00C37A2a36bEfFc9679b3a7a55b5A17').send({
    //   from: accounts[0]
    // });

    // console.log('verifier added');
    // await photographOwnership.methods.getVerifier().call({
    //   from: accounts[0]

    // });
    





  };


  async componentDidMount(){

    
    ipfs.once('ready', async() => {
      console.log('Online status: ', ipfs.isOnline() ? 'online' : 'offline');
      console.log(await ipfs);  
      
    });
    const verifier = await photographOwnership.methods.getVerifier().call();

    this.setState({verifier});


    
  }

  render() {
    
    return (
      <div>
          <h2 align="center"> Photograph Ownership Application</h2>
          <h3 align="center"> NODE 2</h3>
          <hr/>
          <p className="App-title" align="center"> Current verifier: {this.state.verifier}</p>
          <hr/>
          <div align="center">
          <h3>Photograph Registration</h3>
            <form>
              <input type='text' placeholder='Photo Title' value={this.state.title} onChange={event => this.setState({title: event.target.value})}></input> &nbsp;&nbsp;
              
              <br/>
              <input type='text' placeholder='Owner Address' value={this.state.owner_address} onChange={event => this.setState({owner_address: event.target.value})}></input> &nbsp;&nbsp;
              <input type='text' placeholder='Amount' value={this.state.amount} onChange={event => this.setState({amount: event.target.value})}></input>
              <br/>
              <input type='file' onChange={this.captureFile}></input>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <button onClick={this.handleClick}>Submit</button>
              
            </form>
          </div>
          <hr/>
          <div align='center'>
            <h3>Transaction Receipt</h3>
            <p>{this.state.ipfsVerificationText}</p>
            <p>{this.state.addVerificationText}</p>
          </div>
          <br/>
          <hr/>
          <h3 align='center'>Image Search</h3>
          <form align='center'>
            <input placeholder='Title' onChange={event => this.setState({searchTitle: event.target.value})}></input> &nbsp;&nbsp;
            <input placeholder='Owner Address' onChange={event => this.setState({searchOwner_address: event.target.value})}></input> 
            <br/>
            <input placeholder = 'IPFS Hash' onChange={event => this.setState({searchIpfsHash: event.target.value})}></input> 
            <br/>
            <button type='search' onClick={this.searchHandler}>Search</button>

          </form>
          <div align='center'>
          <br/>
            <img align = "center" src = {this.state.url} />
          </div>

      </div>
    );
  }
}

export default App;
