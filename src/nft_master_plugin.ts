import Web3, { Uint256, validator } from 'web3';
import { Web3EthPluginBase, Address, ContractAbi } from "web3";
import { BAYC_ABI } from './erc721_abi';
import axios from 'axios';

type Trait = { [key: string]: string };
type TraitList = { [key: string]: string[] };

type TokenUriHandler = (uri: string) => Promise<any>;

type Attribute = {
  trait_type: string;
  value: string;
};

type Metadata = {
  image?: string;
  attributes: Attribute[];
};


export class NFTPlugin extends Web3EthPluginBase {
  public pluginNamespace = "nftPlugin";
  private web3: Web3;
  private nftCollectionAbi: ContractAbi;
  private contractAddress: Address;
  private handleTokenURI: TokenUriHandler;


  public constructor(web3: Web3, options?: {
    contractAddress?: Address;
    web3Provider?: Web3;
    handleTokenURI?: TokenUriHandler;

  }) {
    super();

    this.contractAddress = options?.contractAddress ?? ''; // empty string if not provided
    if (!validator.isAddress(this.contractAddress)){
      throw new Error("One or more of provided addresses is not a valid address");
    }
    this.web3 = options?.web3Provider ?? web3;
    this.nftCollectionAbi = BAYC_ABI;
    this.handleTokenURI = options?.handleTokenURI ?? this.ipfsHandler; // Corrected property name
    
  }


  // cartesianProduct(input, current) 
  // Returns the cartesian product of an array of objects. 
  // Each object property is an array of strings.
  // Usage: This function is to be used by cartestianProduct (recursively)
  //         and getAllMetadataCombinations
  private cartesianProduct(input: TraitList[], current: any = {}): any[] {
      if (!input || !input.length) { return []; }
  
      const head = input[0];
      const tail = input.slice(1);
      let output: Record<string, string>[] = [];
  
      for (const key in head) {
          for (let i = 0; i < head[key].length; ++i) {
              const newCurrent = this.copy(current);         
              newCurrent[key] = head[key][i];
              if (tail.length) {
                  const productOfTail = this.cartesianProduct(tail, newCurrent);
                  output = output.concat(productOfTail);
              } else {
                  output.push(newCurrent);
              }
          }
      }    
      return output;
  }
  
  // copy(obj) Returns a hard copy of an object
  // Usage: This function is to be used by cartestianProduct
  private copy<T extends Record<string, any>>(obj: T): T {
    const res: Partial<T> = {};
    for (const p in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, p)) {
            res[p] = obj[p];
        }
    }
    return res as T;
}

  // getAllMetadataCombinations(input) 
  // Returns all possible combinations of NFT Metadata given array of options for each trait
  // The returned array of attributes does not include any thumbnail
  // Requires: No trait can have an empty array
  // Usage: This function is to be used by developers
  // Sample Input:
  // [{'Earring': ["Gold", "Silver", ...]}, {'Grin': ["Crooked", "Toothy", ...]}]
  public getAllMetadataCombinations(input: any): Array<Array<{ trait_type: string; value: string }>> {
      const objArr = this.cartesianProduct(input);
      const len = objArr.length;
      
      let ret = []
      for (let i = 0; i < len; ++i) {
          const arr = []
          for (const property in objArr[i]) {
              arr.push({ "trait_type": property, "value": objArr[i][property] });
          }
          ret.push(arr);
      }
      return ret;
  }

  

  // ipfsHandler(ipfsLink) 
  // Handles the API call to an IPFS hash and returns the data
  // Usage: This function is to be used by getNFTMetadata and getNFTImage
  private ipfsHandler(ipfsLink: string): Promise<any> {
    const ipfsPrefix = "ipfs://";
    const pinataGateway = "https://ipfs.io/ipfs/"; 
    // we use gateway.pinata.cloud as our IPFS gateway
    if (ipfsLink.startsWith(ipfsPrefix)) {
      ipfsLink = ipfsLink.replace(ipfsPrefix, pinataGateway);
  } else {
      return Promise.reject(new Error("Invalid IPFS link"));
  }
    return axios.get(ipfsLink);
}
  // getNFTMetadata(tokenId) returns Promise of NFT metadata for NFT of given tokenId
  // in the collection that was specified in the constructor
  // Returns null if NFT was not found and writes to error stream
  // Usage: This function is to be used by developers
  public async getNFTMetadata(tokenId: string): Promise<any> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
    
    try {
      const tokenURI = await (contract.methods.tokenURI as any) (tokenId).call() as string;
      const response = await this.handleTokenURI(tokenURI);

      if (response && response.data) {
        return response.data;
      } else if (response) { 

        return response;
      }
    } catch (error) {
      console.error("Error fetching NFT:", error);
      return null;
    }
  }

  // getNFTImage(tokenId) returns Promise of an image link for the NFT of given tokenId
  // in the collection that was specified in the constructor
  // Returns null if NFT was not found and writes to error stream
  // Usage: This function is to be used by developers
  public async getNFTImage(tokenId: Uint256): Promise<any> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
  
    try {
      const tokenURI = await (contract.methods.tokenURI as any) (tokenId).call() as string;
      const response = await this.handleTokenURI(tokenURI);
      if (response && response.data) {
        return response.data.image;
      } else if (response) { 
        return response.image;
      }
    } catch (error) {
      console.error("Error fetching NFT:", error);
      return null;
    }
  }

  // matchesAttributes(metadata, desired) returns a boolean
  // indicating whether or not the NFT's metadata has the 
  // desired qualities
  // Usage: This function is to be used by filterNFTsByAttributes(attributes)
  private matchesAttributes(metadata: Metadata, desiredAttributes: Attribute[]): boolean {
    if (!metadata.attributes) {
        return false;
    }

    // Check if each desired attribute is present in the NFT's attributes
    for (let desiredAttribute of desiredAttributes) {
        const attribute = metadata.attributes.find(attr => 
            attr.trait_type === desiredAttribute.trait_type && attr.value === desiredAttribute.value);

        // If the attribute is not found or its value doesn't match, return false
        if (!attribute || attribute.value !== desiredAttribute.value) {
            return false;
        }
    }
    return true;
}

  // filterNFTsByAttributes(attributes, rpm) returns all NFTs in the collection
  // that match the passed attributes. RPM is the requests per minute the NFTPlugin object's
  // gateway allows. By default it is 200 and if 0 is passed, no rate limit is enforced.
  // Usage: This function is to be used by developers
  // requires: NFT Collection implements the optional enumeration extension
  //           NFT Collection has an attributes array [{ "trait_type": "X", "value": "Y" }, ...]
  public async filterNFTsByAttributes(attributes: Record<string, any>, rpm?: number): Promise<any[]> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
    const filteredNFTs = [];
    let itr = BigInt(0);
    const size = await this.getCollectionSize();

    rpm = rpm? rpm : 200
    let delay = 0;
    if (rpm !== 0) {
      delay = (60 / rpm ) * 1000; 
    }
  
    const delayPromise = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    while (itr < size) {
      const tokenId = await (contract.methods.tokenByIndex as any)(itr).call();
  
      const nftMetaData = await this.getNFTMetadata(tokenId);
      
      if (nftMetaData && this.matchesAttributes(nftMetaData, (attributes as any))) {
        filteredNFTs.push(nftMetaData);
      }
  
      itr = itr + BigInt(1);
  
      // Wait for the specified delay before the next iteration
      await delayPromise(delay);
    }
  
    return filteredNFTs;
  }
  

  // getCollectionSize() returns the number of NFTs in the collection
  // Usage: This function is to be used by developers and filterNFTsByAttributes
  // requires: NFT Collection implements the optional enumeration extension
  public async getCollectionSize(): Promise<bigint> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
    return (contract.methods.totalSupply as any) ().call();
  }

  // getTraitRarityScore(trait) returns the rarity of a given trait
  // calculated by # of NFTs / # of occurences of the trait
  // Usage: This function is to be used by developers
  public async getTraitRarityScore(trait: Trait): Promise<bigint> {
    
    const num = await this.getCollectionSize();
    const denom = await this.filterNFTsByAttributes([trait]);
    if (denom.length == 0) {
      return BigInt(0);
    }
    return num / BigInt(denom.length);
  }

  // filterNFTsByOwner(owner, rpm) returns all NFTs in the collection
  // that have the specified owner. RPM is the requests per minute the NFTPlugin object's
  // gateway allows. By default it is 200 and if 0 is passed, no rate limit is enforced.
  // Usage: This function is to be used by developers
  // requires: NFT Collection implements the optional enumeration extension
  //           NFT Collection has an attributes array [{ "trait_type": "X", "value": "Y" }, ...]
  public async filterNFTsByOwner(owner: Address, rpm?: number): Promise<any[]> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
    const filteredNFTs = [];
    let itr = BigInt(0);
    const size = await this.getCollectionSize();

    rpm = rpm? rpm : 200
    let delay = 0;
    if (rpm !== 0) {
      delay = (60 / rpm ) * 1000; 
    }
  
    const delayPromise = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    while (itr < size) {
      const tokenId = await (contract.methods.tokenByIndex as any)(itr).call();
      let returnedOwner = await (contract.methods.ownerOf as any)(tokenId).call()
      if (returnedOwner == owner) {
        const nftMetaData = await this.getNFTMetadata(tokenId);
        filteredNFTs.push(nftMetaData);
      }
  
      itr = itr + BigInt(1);
  
      // Wait for the specified delay before the next iteration
      await delayPromise(delay);
    }
  
    return filteredNFTs;
  }

  /*
  * The following functions are only for testing
  * They reduce the number of NFTs used to allow quick results opposed to the thousands of NFTs
  * we would iterate over to check if our plugin worked with the BAYC collection
  */

  public async doNotUseThisFunction_filterNFTsByAttributes(attributes: Record<string, any>, rpm?: number): Promise<any[]> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
    const filteredNFTs = [];
    let itr = BigInt(0);
    const size = 10;

    rpm = rpm? rpm : 200
    let delay = 0;
    if (rpm !== 0) {
      delay = (60 / rpm ) * 1000; 
    }
  
    const delayPromise = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    while (itr < size) {
      const tokenId = await (contract.methods.tokenByIndex as any)(itr).call();
  
      const nftMetaData = await this.getNFTMetadata(tokenId);
      
      if (nftMetaData && this.matchesAttributes(nftMetaData, (attributes as any))) {
        filteredNFTs.push(nftMetaData);
      }
  
      itr = itr + BigInt(1);
  
      // Wait for the specified delay before the next iteration
      await delayPromise(delay);
    }
  
    return filteredNFTs;
  }

  public async doNotUseThisFunction_getTraitRarityScore(trait: Trait): Promise<bigint> {
    
    const num = await this.getCollectionSize();
    const denom = await this.doNotUseThisFunction_filterNFTsByAttributes([trait]);
    if (denom.length == 0) {
      return BigInt(0);
    }
    return num / BigInt(denom.length);
  }

  public async doNotUseThisFunction_filterNFTsByOwner(owner: Address, rpm?: number): Promise<any[]> {
    const contract = new this.web3.eth.Contract(this.nftCollectionAbi, this.contractAddress);
    const filteredNFTs = [];
    let itr = BigInt(0);
    const size = 31;

    rpm = rpm? rpm : 200
    let delay = 0;
    if (rpm !== 0) {
      delay = (60 / rpm ) * 1000; 
    }
  
    const delayPromise = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    while (itr < size) {
      const tokenId = await (contract.methods.tokenByIndex as any)(itr).call();
      let returnedOwner = await (contract.methods.ownerOf as any)(tokenId).call()
      if (returnedOwner == owner) {
        const nftMetaData = await this.getNFTMetadata(tokenId);
        filteredNFTs.push(nftMetaData);
      }
  
      itr = itr + BigInt(1);
  
      // Wait for the specified delay before the next iteration
      await delayPromise(delay);
    }
  
    return filteredNFTs;
  }

}

// Module Augmentation
declare module "web3" {
  interface Web3Context {
    nftPlugin: NFTPlugin;
  }
}

