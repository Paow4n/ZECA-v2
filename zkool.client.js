const { GraphQLClient, gql } = require('graphql-request');

class ZkoolClient {
  constructor(endpoint, options = {}) {
    this.client = new GraphQLClient(endpoint, options);
    this.accountId = 1;
    this.syncLock = false;
    this.syncTask = undefined;
  }

  async #request(document, variables, requestHeaders) {
    return this.client.request(document, variables, requestHeaders);
  }

  /**
   * Inicializa o backend e liga a rotina de sincronização.
   */
  async init() {
    return new Promise(async (resolve, reject) => {
      const rep = await this.#request(
        gql`
          query PingApiVersion {
            apiVersion
          }
        `
      );

      if(rep.apiVersion) {
        console.log("Zkool SDK: Conectado à API.");
        this.syncTask = this.spawnSyncTask();        
        resolve();
      }
      else {
        reject();
      }
    });
  }

  /**
   * Importa a UFVK para monitoramento.
   */
  async createNewAccount(key, accountIndex, birth = 0, accountName, passphrase = "") {
    const result = await this.#request(
      gql`
        mutation CreateNewAccount($newAccount: NewAccount!) {
          createAccount(
            newAccount: $newAccount          
          )
        }
      `, {
        newAccount: {
          key: key,
          aindex: accountIndex,
          birth: birth,
          name: accountName,
          passphrase: passphrase,
          useInternal: false
        }
      }
    );
    return result;
  }

  /**
   * Busca o endereço (UA).
   */
  async getAddress(accountId = this.accountId) {
    const result = await this.#request(
      gql`
        query GetAddress($id: Int!) {
          addressByAccount(idAccount: $id) {
            ua
            orchard
            sapling
            transparent
          }
        }
      `, {
        id: accountId
      }
    );
    return result.addressByAccount;
  }

  /**
   * Lista as transações da conta.
   */
  async getTransactions(accountId = this.accountId) {
    const result = await this.#request(
      gql`
        query GetTransactions($id: Int!) {
          transactionsByAccount(idAccount: $id) {
            txid
            value
            fee
            time
            height
          }
        }
      `, {
        id: accountId
      }
    );
    return result.transactionsByAccount
  }

  /**
   * Busca detalhes específicos de uma transação (como o Memo).
   */
  async getTransactionInfo(accountId = this.accountId, txid) {
    const result = await this.#request(
      gql`
        query GetTransactionInfo($id: Int!, $txid: String!) {
          transactionById(idAccount: $id, txid: $txid) {
            height
            txid
            value
            notes {
              address
              memo
              value
              pool
            }
          }
        }
      `, {
        id: accountId,
        txid: txid
      }
    );
    return result.transactionById;
  }

  async getServerHeight() {
    const result = await this.#request(
      gql`
        query GetServerHeight {
          currentHeight
        }
      `
    );
    return result.currentHeight;
  }

  async getWalletHeight(accountId = this.accountId) {
    let result = await this.#request(
      gql`
        query GetWalletHeight($filter: AccountFilter!) {
          accounts(accountFilter: $filter) {
            height
          }
        }
      `, {
        filter: {
          id: accountId
        }
      }
    );
    return result.accounts[0].height;
  }

  async synchronize(accountId = this.accountId) {
    return this.#request(
      gql`
        mutation SynchronizeAccount($ids: [Int!]!) {
          synchronize(idAccounts: $ids)
        }
      `, {
        ids: accountId
      }
    );    
  }

  /**
   * Mantém a carteira do Bot sempre atualizada com a rede Zcash.
   */
  spawnSyncTask(accountId = this.accountId) {
    const syncTimer = setInterval(async () => {
      if(this.syncLock) return;

      this.syncLock = true;
      
      try {
        const serverHeight = await this.getServerHeight();
        const accHeight =  await this.getWalletHeight(accountId);
        
        if(serverHeight > accHeight) {
          console.log(`[ZK-SYNC] Sincronizando: bloco atual ${accHeight} -> alvo ${serverHeight} (${serverHeight - accHeight} blocos atrás)`);
          await this.synchronize(accountId);
        }
      } catch (err) {
        console.log(`[ZK-SYNC ERROR] Falha na sincronização em background: ${err.message}`);
      } finally {
        this.syncLock = false;
      }
    }, 60 * 1000); 

    return syncTimer;
  }
}

module.exports = { ZkoolClient, gql };