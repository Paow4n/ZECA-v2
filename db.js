const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite', // O arquivo será salvo na sua pasta /app mapeada no Windows
    logging: false,
});

const Transaction = sequelize.define('transaction', {
    txid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true, // Corrigido o erro de digitação
    },
    value: {
        type: DataTypes.BIGINT, // Protege contra valores altos de Zatoshis
        allowNull: false,
    },
    height: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    memo: {
        type: DataTypes.TEXT, // Permite os 512 bytes completos dos Memos da Zcash
        allowNull: true,
    },
});

async function init() {
    try {
        await sequelize.authenticate();
        // O sync() é vital! Ele verifica se a tabela existe e a cria se necessário.
        await sequelize.sync(); 
        console.log('Database connected and synchronized.');
    } catch (err) {
        console.error('Unable to connect to Database.', err);
    }
}

module.exports = { sequelize, Transaction, init };