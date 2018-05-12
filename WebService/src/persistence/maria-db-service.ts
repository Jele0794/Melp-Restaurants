import { createConnection, Connection, ConnectionConfig, QueryFunction, MysqlError } from "mysql";
import { Observable, Subject } from 'rxjs';
import { Constants } from "../utils/constants";

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
                subject.next(undefined);                
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
            sql = `SELECT * FROM ?? WHERE ${identifier} = ${connection.escape(value)}`;
        } else {
            sql = `SELECT * FROM ?? WHERE ${identifier} LIKE \'%${value}%\'`;
        }    
        connection.query(sql, [tableName], (error, results) => {
            if (error) {
                this.handleSqlError(error, connection);
                subject.next(undefined);
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
     * Create data on db.
     *
     * @param tableName DB table name.
     * @param values List of data to create.
     */
    public static create<T>(tableName: string, values: T[]): Observable<T[]> {
        let connection: Connection = this.generateConnection();
        let subject: Subject<T[]> = new Subject();
        let valuesString: string[] = [];
        let sql: string;
        let reducedValues: string;
        let modDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        values.forEach((value) => valuesString.push(value.toString()));
        reducedValues = valuesString.map(value => `(${value}, \'${modDate}\', 0, 1)`).join(', ');
        sql = `INSERT INTO ${tableName} VALUES ${reducedValues};`;
        
        connection.beginTransaction((error) => {
            if (error) {
                this.handleSqlError(error, connection);
                subject.next(undefined)                
            }
            // insert values.
            connection.query(sql, (error, results) => {
                if (error) {
                    connection.rollback(() => this.handleSqlError(error, connection));
                    subject.next(undefined)                    
                }
                // commit changes.
                connection.commit((error) => {
                    if (error) {
                        connection.rollback(() => this.handleSqlError(error, connection));
                        subject.next(undefined)                        
                    }
                    subject.next(values)
                });
            })
            // on finish, close connection.
            .on('end', () => this.safeCloseConnection(connection));

        });

        return subject.asObservable();
    }

    public static update<T>(tableName: string, value: T, columns: string[], identifier: string, whereValue: string, mapper: any): Observable<T> {
        let connection: Connection = this.generateConnection();
        let subject: Subject<T> = new Subject();
        let sql: string;
        let modDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let columnsStr: string[] = [];
        value = mapper(value);
        let i = 0;
        for(let key in value) {
            if(key === columns[i]) {
                let columnStr = columns[i++] + ' = ' + `\'${value[key]}\'`;
                columnsStr.push(columnStr);
            }
        }
        columnsStr.push(Constants.RESTAURANT_TABLE.DT_LAST_MODIFICATION + `= \'${modDate}\'`);
        columnsStr.push(Constants.RESTAURANT_TABLE.ID_LAST_USER_MODIFIER + '=' + 0);
        columnsStr.push(Constants.RESTAURANT_TABLE.FG_ACTIVE + '=' + true);
        sql = `UPDATE ${tableName} SET ${columnsStr.join(', ')} WHERE ${identifier} = ?`;

        connection.beginTransaction((error) => {
            if (error) {
                this.handleSqlError(error, connection);
                subject.next(undefined)
            }
            // insert values.
            connection.query(sql, [whereValue], (error, results) => {
                if (error) {
                    connection.rollback(() => this.handleSqlError(error, connection));
                    subject.next(undefined)
                }
                // commit changes.
                connection.commit((error) => {
                    if (error) {
                        connection.rollback(() => this.handleSqlError(error, connection));
                        subject.next(undefined)
                    }
                    subject.next(value);
                });
            })
            // on finish, close connection.
            .on('end', () => this.safeCloseConnection(connection));

        });

        return subject.asObservable();
    }

    public static delete<T>(tableName: string, idColumn: string, id: string): Observable<string> {
        let connection: Connection = this.generateConnection();
        let subject: Subject<string> = new Subject();
        let sql: string = `UPDATE ${tableName} SET ${Constants.RESTAURANT_TABLE.FG_ACTIVE} = 0 WHERE ${idColumn} = \'${id}\'`;

        connection.query(sql, (error, results) => {
            if (error) {
                this.handleSqlError(error, connection);
                subject.next(undefined);
            }
            // send to subject.
            subject.next(id);
        })
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
