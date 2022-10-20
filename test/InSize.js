
const { expect } = require("chai")
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers")

describe("InSize contract", function() {
  async function deployFixture() {
    const Token = await ethers.getContractFactory("InSize");
    const token = Token.deploy();
    return token;
  }

  it("Deployment shoud assign the owner address to the admin variable", async function() {
    const [owner] = await ethers.getSigners();
    const token = await loadFixture(deployFixture)
    const admin = await token.admin();
    expect(await owner.getAddress()).to.equal(admin);
  });

  it("only admin can mint token to admin", async function() {
    const [owner, addr1] = await ethers.getSigners();
    const token = await loadFixture(deployFixture);
    await expect(token.connect(addr1).mintToAdmin(30)).to.be.revertedWith("not admin");
  });

  it("only admin can mint token to others", async function() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const token = await loadFixture(deployFixture);
    await expect(token.connect(addr1).mint(addr2.getAddress(), 30)).to.be.revertedWith("not admin");
  });

  it("admin mint tokens to himself", async function() {
    const number = 30;
    const [owner] = await ethers.getSigners();
    const owner_address = owner.getAddress();
    const token = await loadFixture(deployFixture);
    const ok = token.mintToAdmin(number);
    expect(await token.balanceOf(owner_address)).to.equal(number);
    expect(await token.totalSupply()).to.equal(number);
  });

  it("admin mint tokens to someone", async function() {
    const number = 1000;
    const [owner, addr1] = await ethers.getSigners();
    const addr1_address = await addr1.getAddress();
    const token = await loadFixture(deployFixture);
    const ok = token.mint(addr1_address, number);
    expect(await token.balanceOf(addr1_address)).to.equal(number);
    expect(await token.totalSupply()).to.equal(number);
  });

  it("only current admin can change admin", async function() {
    const [owner, addr1] = await ethers.getSigners();
    const token = await loadFixture(deployFixture);
    await expect(token.connect(addr1).changeAdmin(addr1.getAddress())).to.be.revertedWith("only current admin can change admin address");
  });
	
  it("change admin", async function() {
	  const number = 100;
    const [owner, addr1] = await ethers.getSigners();
    const token = await loadFixture(deployFixture);
    const addr1_address = await addr1.getAddress();
    token.changeAdmin(addr1_address)
    expect(await token.admin()).to.equal(addr1_address);
    await expect(token.mintToAdmin(number)).to.be.revertedWith("not admin");
  });

  // transfer related test
  it("transfer too much token to other", async function() {
    const number = 1000;
    const [owner, addr1, addr2] = await ethers.getSigners();
    const addr1_address = await addr1.getAddress();
    const addr2_address = await addr2.getAddress();
    const token = await loadFixture(deployFixture);
    token.mint(addr1_address, number);
    await expect(token.connect(addr1).transfer(addr2_address, number+1)).to.be.revertedWith("balance is not enough");
  });

  it("transfer to 0 address", async function() {
    const zero_address = ethers.constants.AddressZero;
    const number = 1000;
    const [owner, addr1] = await ethers.getSigners();
    const token = await loadFixture(deployFixture);
    token.mint(addr1.getAddress(), number);
    await expect(token.connect(addr1).transfer(zero_address, number)).to.be.revertedWith("cannot transfer token to zero address");
  });

  it("transfer to other address", async function() {
    const number = 1000;
    const [owner, account1, account2] = await ethers.getSigners();
    const addr1 = await account1.getAddress();
    const addr2 = await account2.getAddress();
    const token = await loadFixture(deployFixture);
    token.mint(addr1, number);
    expect(await token.balanceOf(addr1)).to.equal(number);
    expect(await token.totalSupply()).to.equal(number);
    await token.connect(account1).transfer(addr2, number);
    expect(await token.balanceOf(addr1)).to.equal(0);
    expect(await token.balanceOf(addr2)).to.equal(number);
    expect(await token.totalSupply()).to.equal(number);
  });
  
  // approve related test
  it("cannot approve to zero address", async function() {
    const number = 1000;
    const zero_address = ethers.constants.AddressZero;
    const [owner, account1, account2] = await ethers.getSigners();
    const addr1 = await account1.getAddress();
    const addr2 = await account2.getAddress();
    const token = await loadFixture(deployFixture);
    await expect(token.connect(account1).approve(zero_address, number)).to.be.revertedWith("can not approve to zero address");
  });

  it("approve too much", async function() {
    const number = 1000;
    const [owner, account1, account2] = await ethers.getSigners();
    const addr1 = await account1.getAddress();
    const addr2 = await account2.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, 10);
    await expect(token.connect(account1).approve(addr2, number)).to.be.revertedWith("balance is not enough");
  });

  it("approve to other", async function() {
    const number = 1000;
    const [owner, account1, account2] = await ethers.getSigners();
    const addr1 = await account1.getAddress();
    const addr2 = await account2.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    await token.connect(account1).approve(addr2, number);
    expect(await token.allowance(addr1, addr2)).to.equal(number);
  });

  it("transfer token out of approved amount", async function() {
    const number = 1000;
    const [owner, account1, account2] = await ethers.getSigners();
    const owner_addr = await owner.getAddress();
    const addr1 = await account1.getAddress();
    const addr2 = await account2.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    await token.connect(account1).approve(addr2, number - 1);
    await expect(token.connect(account2).transferFrom(addr1, owner_addr, number)).to.be.revertedWith("allowance is not enough");
  });

  it("transfer token according to approved amount", async function() {
    const number = 100;
    const [owner, account1, account2] = await ethers.getSigners();
    const owner_addr = await owner.getAddress();
    const addr1 = await account1.getAddress();
    const addr2 = await account2.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    await token.connect(account1).approve(addr2, number - 1);
    await token.connect(account2).transferFrom(addr1, owner_addr, number-10);
    expect(await token.balanceOf(addr1)).to.equal(10);
    expect(await token.balanceOf(owner_addr)).to.equal(number-10);
    expect(await token.allowance(addr1, addr2)).to.equal(9);
  });


  // burn related test
  it("only admin can burn token", async function() {
    const number = 100;
    const [owner, account1] = await ethers.getSigners();
    const owner_addr = await owner.getAddress();
    const addr1 = await account1.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    await expect(token.connect(account1).burn(addr1, number)).to.be.revertedWith("not admin");
  });

  it("burn too much", async function() {
    const number = 100;
    const [owner, account1] = await ethers.getSigners();
    const owner_addr = await owner.getAddress();
    const addr1 = await account1.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    expect(await token.balanceOf(addr1)).to.be.equal(number);
    await expect(token.burn(addr1, number+1)).to.be.revertedWith("balance is not enough");
  });

  it("burn some", async function() {
    const number = 100;
    const [owner, account1] = await ethers.getSigners();
    const owner_addr = await owner.getAddress();
    const addr1 = await account1.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    expect(await token.balanceOf(addr1)).to.be.equal(number);
    expect(await token.totalSupply()).to.be.equal(number);

    await token.burn(addr1, number-10);

    expect(await token.balanceOf(addr1)).to.be.equal(10);
    expect(await token.totalSupply()).to.be.equal(10);
  });

  it("burn all", async function() {
    const number = 100;
    const [owner, account1] = await ethers.getSigners();
    const owner_addr = await owner.getAddress();
    const addr1 = await account1.getAddress();
    const token = await loadFixture(deployFixture);
    await token.mint(addr1, number);
    expect(await token.balanceOf(addr1)).to.be.equal(number);
    expect(await token.totalSupply()).to.be.equal(number);

    await token.burnAll(addr1);

    expect(await token.balanceOf(addr1)).to.be.equal(0);
    expect(await token.totalSupply()).to.be.equal(0);
  });
});
