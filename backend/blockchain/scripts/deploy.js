async function main() {
  console.log("Deploying IdentityAnchor...");

  const IdentityAnchor = await ethers.getContractFactory("IdentityAnchor");
  const contract = await IdentityAnchor.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("----------------------------------------------------");
  console.log("IdentityAnchor deployed to:", address);
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});