# web3.js-plugin-nft-master
![Node Version](https://img.shields.io/badge/node-20.x-green)

NFT Master is a web3.js plugin designed to simplify and enhance the interaction with ERC-721 NFTs. It is aimed primarily at developers, providing a robust suite of tools for querying NFT collections and NFT statistics. NFT Master facilitates seamless interaction between DApps and NFT collections.


## Installation
```
npm i @saileshp56/web3.js-plugin-nft-master
```

## Registering the Plugin with a web3.js Instance
For the web3 attribute, use any web3.js blockchain provider.\
For contractAddress, use the contract address of the NFT collection. For example, the Bored Ape Yacht Club contractAddress is: 
```
0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d
```
For handleTokenURI, use a function that returns a GET request to the file storage of the NFT. Leave it empty to handle IPFS hashes. See metadataHandlers.ts for examples of this.
```typescript
import { NFTPlugin } from "@saileshp56/web3.js-plugin-nft-master";
import { Web3, core } from "web3";

// Initialize Web3 with a provider URL
let web3: Web3 = new Web3('https://eth-mainnet.alchemyapi.io/v2/<your_api_key>');

// Define the options for initializing NFTPlugin
const nftPluginOptions = {
  contractAddress: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // BAYC Address
};

// Register NFTPlugin with initialization values
web3.registerPlugin(new NFTPlugin(web3, nftPluginOptions));

// Initialize Web3Context
const web3Context = new core.Web3Context(web3);

// Register NFTPlugin with Web3Context
web3Context.registerPlugin(new NFTPlugin(web3, nftPluginOptions));
```

## Function Documentation:
```typescript
  // getAllMetadataCombinations(input) 
  // Returns all possible combinations of NFT Metadata given array of options for each trait
  // The returned array of attributes does not include any thumbnail
  // Requires: No trait can have an empty array
  // Usage: This function is to be used by developers
  // Sample Input:
  // [{'Earring': ["Gold", "Silver", ...]}, {'Grin': ["Crooked", "Toothy", ...]}]
  public getAllMetadataCombinations(input: Trait[]): Array<Array<{ trait_type: string; value: string }>>

  // getNFTMetadata(tokenId) returns Promise of NFT metadata for NFT of given tokenId
  // in the collection that was specified in the constructor
  // Returns null if NFT was not found and writes to error stream
  // Usage: This function is to be used by developers
  // Requires: tokenId is a valid id of an NFT in the collection
  public async getNFTMetadata(tokenId: string): Promise<any>

  // getNFTImage(tokenId) returns Promise of the image link for the NFT of given tokenId
  // in the collection that was specified in the constructor
  // Returns null if NFT was not found and writes to error stream
  // Usage: This function is to be used by developers
  public async getNFTImage(tokenId: Uint256): Promise<any>

  // filterNFTsByAttributes(attributes, rpm) returns all NFTs in the collection that match the passed attributes.
  // RPM is the requests per minute the NFTPlugin object's gateway allows.
  // By default it is 200 and if 0 is passed, no rate limit is enforced.
  // Usage: This function is to be used by developers
  // requires: NFT Collection implements the optional enumeration extension
  //           NFT Collection has an attributes array [{ "trait_type": "X", "value": "Y" }, ...]
  public async filterNFTsByAttributes(attributes: Record<string, any>, rpm?: number): Promise<any[]>

  // getCollectionSize() returns the number of NFTs in the collection
  // Usage: This function is to be used by developers and filterNFTsByAttributes
  // requires: NFT Collection implements the optional enumeration extension
  public async getCollectionSize(): Promise<bigint> 

  // getTraitRarityScore(trait) returns the rarity of a given trait
  // calculated by # of NFTs / # of occurences of the trait
  // Usage: This function is to be used by developers
  public async getTraitRarityScore(trait: Trait): Promise<bigint>

  // filterNFTsByOwner(owner, rpm) returns all NFTs in the collection
  // that have the specified owner. RPM is the requests per minute the NFTPlugin object's
  // gateway allows. By default it is 200 and if 0 is passed, no rate limit is enforced.
  // Usage: This function is to be used by developers
  // requires: NFT Collection implements the optional enumeration extension
  public async filterNFTsByOwner(owner: Address, rpm?: number): Promise<any[]>
```
## Run the Tests
Enter your preferred blockchain provider in index.test.ts otherwise most tests won't be able to run
