import axios from "axios";

/*
* This file is a couple of handleTokenURI handlers the developer can use
* to read the metadata of a returned NFT
*/


// function handleDataURI(jsonLink)
// handles the API call to a Data URI Scheme (JSON) page and returns the data
// Usage: This function is to be passed to the constructor as the handleTokenURI attribute
function handleDataURI (dataURI:string): Promise<any> {
  // Check if the URI is a valid data URI
  if (!dataURI.startsWith ('data:application/json;base64,')) {
      throw new Error ('Invalid data URI format');
    }

  // Extract the base64 part of the data URI
  const base64Encoded = dataURI.split (',')[1];

  // Decode the base64 string
  const jsonStr = atob (base64Encoded);

  // Parse the JSON string
  try {
    const jsonData = JSON.parse (jsonStr);
    return jsonData;
  }
  catch (error) {
    throw new Error ('Invalid JSON format');
  }
}

// function handleDataURI(jsonLink)
// handles the API call to an ipfs blanknetwork page and returns the data
// Usage: This function is to be passed to the constructor as the handleTokenURI attribute
function handleBlanketNetwork (dataLink:string): Promise<any> {
  // Check if the URI is a valid data URI
  if (!dataLink.startsWith ('https://ipfs.blanknetwork.com/')) {
      throw new Error ('Invalid data URI format');
    }

  return axios.get(dataLink);
}


  // ipfsHandler(ipfsLink)
  // Handles the API call to an IPFS hash and returns the data
  // Usage: This function is to be used by getNFTMetaData and getNFTImage
  function ipfsHandler(ipfsLink: string): Promise<any> {
    const ipfsPrefix = "ipfs://";
    const pinataGateway = "https://ipfs.io/ipfs/"; 
    // we use gateway.pinata.cloud as our IPFS gateway
    // additional functionality should be included to let this be changed
    if (ipfsLink.startsWith(ipfsPrefix)) {
      ipfsLink = ipfsLink.replace(ipfsPrefix, pinataGateway);
  } else {
      return Promise.reject(new Error("Invalid IPFS link"));
  }
    return axios.get(ipfsLink);
}