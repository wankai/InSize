// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.11;

contract InSize {
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);

    string public constant name = "InSize";
    string public constant symbol = "SIZE";
    uint8 public constant decimals = 1;

    uint public totalSupply;

    mapping (address => uint) balances_;

    mapping (address => mapping (address => uint)) allowances_;

    address internal admin_;
    
    constructor() {
        admin_ = msg.sender;
    }
    
    function admin() public view returns (address) {
        return admin_;
    }
    
    function changeAdmin(address newAdmin) public returns (bool) {
        admin_ = newAdmin;
        return true;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return balances_[owner];
    }

    function allowance(address owner, address spender) public view returns (uint) {
        return allowances_[owner][spender];
    }

    function approve(address spender, uint amount) public returns (bool) {
        address sender = msg.sender;

        require(spender != address(0), "cannot approve zero address");
        require(balances_[sender] >= amount, "blance is not enough");

        allowances_[sender][spender] = amount;

        emit Approval(sender, spender, amount);
        return true;
    }

    function transfer(address to, uint amount) public returns (bool) {
        return _transferToken(msg.sender, to, amount);
    }
    function transferFrom(address from, address to, uint amount) public returns (bool) {
        uint oldAllowance = allowances_[from][to];
        require (oldAllowance >= amount, "allowance is not enough");
        uint newAllowance = oldAllowance - amount;
        allowances_[from][to] = newAllowance;
        emit Approval(from, to, newAllowance);
        return _transferToken(from, to, amount);
    }

    function _transferToken(address from, address to, uint amount) internal returns (bool) {
        require(from != address(0), "from address cannot be zero");
        require(to != address(0), "to address cannot be zero");
        require(balances_[from] >= amount, "blance is not enough");

        balances_[from] -= amount;
        balances_[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint amount) public returns (bool) {
        require(msg.sender == admin_, "not admin");
        balances_[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
        return true;
    }

    function mintToAdmin(uint amount) public returns (bool) {
        return mint(msg.sender, amount);
    }
}
