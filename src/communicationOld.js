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

class Communication extends Component {

  state={
    account:'',
    title: '',
    messages : []
  }

  handleClick = async () => {

    var generatedSymKey= await web3.shh.generateSymKeyFromPassword('hello');    
    var symKey= await web3.shh.getSymKey(generatedSymKey);    
    var symKeyID= await web3.shh.addSymKey(symKey);
    
    var publicKey = "-----BEGIN PUBLIC KEY-----"+
                    "MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgG/BC0TEkEZKJp/foPUsdaPZ7WG3"+
                    "DPlJtrGZQX0m2FFiJP59KhkWlrRXxRjOYV+RBrIUePrYdu0SbYp6QTY3WEc1UED7"+
                    "/UDMmmI0tW3t3CGVVWxrSuKFa61KZMh/8IF4nl+vLLpz4p/XYeaXVVNsaMQXBapT"+
                    "2Hzyy0TwuA8EhPENAgMBAAE="+
                    "-----END PUBLIC KEY-----";

    var encrypt = new JsEncryptModule.JSEncrypt();

    encrypt.setPublicKey(publicKey);
    var ciphertext = encrypt.encrypt("node2: " + this.state.title);
    console.log("ciphertext  : " + ciphertext);

    
    web3.shh.post({
      symKeyID: symKeyID, //symKeyID of the sender
      ttl: 10,
      topic: '0x07678231',
      powTarget: 2.01,
      powTime: 2,
      payload: web3.utils.fromAscii(ciphertext)
      });

    this.setState(prevState => ({
      messages: [...prevState.messages, "node2: "+this.state.title]
    }));
    this.setState({title: ''});
  };

  endChat = async () => {
    this.setState({messages: []});
  };
  
  async componentDidMount(){



    var generatedSymKey= await web3.shh.generateSymKeyFromPassword('hello');    
    var symKey= await web3.shh.getSymKey(generatedSymKey);    
    var symKeyID= await web3.shh.addSymKey(symKey);

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
    

    web3.shh.newMessageFilter({symKeyID: symKeyID, topic: '0x07678231'}).then(filterId => {
      setInterval(() => {
        web3.shh.getFilterMessages(filterId).then(messages => {
          for (let msg of messages) {
            console.log(msg.topic);
            if(msg.topic !== '0x07678231') return;
            
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
      <div>
        <h1>This is node 2</h1>

        {this.state.messages.map(msg => (
          <div>{msg}</div>
        ))}
        <br/>
        
        <input type='text' placeholder='message' value={this.state.title} onChange={event => this.setState({title: event.target.value})}></input> &nbsp;&nbsp;
        <button onClick={this.handleClick}>Send Message</button> <br/><br/>
        <button onClick={this.endChat}>End Chat</button>
        <h3>{this.state.account}</h3>
      </div>
    );
  }
}

export default Communication;
