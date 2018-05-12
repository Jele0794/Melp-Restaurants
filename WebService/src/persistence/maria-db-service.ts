import { createConnection, Connection, ConnectionConfig, QueryFunction, MysqlError } from "mysql";
import { Observable, Subject } from 'rxjs';

export class MariaDBService {

    /**
     * Query select * from tableName, map the result
     * and add it to a subject, which is returned.
     *
     * @param tableName DB table name.
     * @param mapper Mapper function to use.
     */
    public static findAll<T>(tableName: string, mapper?: any): Observable<T[]> {
        let connection: Connection = this.generateConnection();
        let subject: Subject<T[]> = new Subject();
        
        connection.query('SELECT * FROM ??', [tableName], (error, results) => {
            if (error) {
                this.handleSqlError(error, connection);
            }
            let mappedResults: any = [];
            // map each result.
            results.forEach((res: any) => mappedResults.push(mapper(res)));
            // send to subject.
            subject.next(mappedResults);
        })
        // on finish, close connection.
        .on('end', () => this.safeCloseConnection(connection));

        return subject.asObservable();
    }

    /**
     * Create an sql statement with the arguments received. Then query for results.
     *
     * @param tableName DB table name.
     * @param identifier SQL Where column identifier.
     * @param value Value to search.
     * @param equals Flag to define if an iquals is required instead of a 'LIKE'.
     * @param mapper Mapper function to use.
     */
    public static findBy<T>(tableName: string, identifier: string, value: string, equals?: boolean, mapper?: any): Observable<T[]> {
        let connection: Connection = this.generateConnection();
        let subject: Subject<T[]> = new Subject();
        let sql: string;
        if (equals) {
            sql = 'SELECT * FROM ?? WHERE ' + identifier + ' = ' + connection.escape(value);
        } else {
            sql = 'SELECT * FROM ?? WHERE '+ identifier +' LIKE \'%' + value + '%\'';
        }    
        connection.query(sql, [tableName], (error, results) => {
            if (error) {
                this.handleSqlError(error, connection);
            }
            let mappedResults: any = [];
            // map each result.
            results.forEach((res: any) => mappedResults.push(mapper(res)));
            // send to subject.
            subject.next(mappedResults);
        })
            .on('fields', (fields, index) => console.log(fields))
        // on finish, close connection.
        .on('end', () => this.safeCloseConnection(connection));

        return subject.asObservable();        
    }

    /**
     * Create a db connection.
     */
    private static generateConnection(): Connection {
        let connectionConfig: ConnectionConfig = {
            host: 'localhost',
            port: 3306,
            database: 'MelpRestaurantsApp',
            user: 'MelpDBAdmin',
            password: 'm3194ppDB'
        };
        return createConnection(connectionConfig);
    }

    /**
     * If connection exists, close it.
     *
     * @param connection Connection.
     */
    private static safeCloseConnection(connection: Connection) {
        if (connection) {
            connection.end();
        }
    }

    /**
     * Handle error.
     *
     * @param error My Sql error.
     * @param connection Connection.
     */
    private static handleSqlError(error: MysqlError, connection: Connection): any {
        console.error(error)
        this.safeCloseConnection(connection)
        return undefined;
    }
}
