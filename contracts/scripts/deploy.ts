import { ethers } from "hardhat";

async function main() {
  const Shield = await ethers.getContractFactory("Shield");
  const shield = await Shield.deploy();

  console.log(`Shield deployed to: ${shield.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
