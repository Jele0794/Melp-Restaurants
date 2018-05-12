import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from "path";
import { RestaurantApi } from './routes/restaurants/index';

export class Server {
    
    public app: express.Application;
    
    /**
    * Constructor.
    *
    */
    constructor() {
        //create expressjs application
        this.app = express();
        
        //configure application
        this.config();
        
        //add routes
        this.routes();
        
        //add api
        this.api();
    }
    
    /**
    * Bootstrap the application.
    *
    * @return Returns the newly created injector for this app.
    */
    public static bootstrap(): Server {
        return new Server();
    }
    
    /**
    * Create REST API routes
    */
    public api() {
        let router: express.Router;
        router = express.Router();

        // restaurant api
        new RestaurantApi(router);

        //use router middleware
        this.app.use('/', router);
    }
    
    /**
    * Configure application
    */
    public config() {
        //use json form parser middlware
        this.app.use(bodyParser.json());

        //catch 404 and forward to error handler
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            err.status = 404;
            next(err);
        });
    }
    
    /**
    * Create router
    */
    public routes() {
        
    }
}