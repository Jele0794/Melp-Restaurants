export class Restaurant {
    public id: string;
    public rating: number;
    public name: string;
    public site: string;
    public email: string;
    public phone: string;
    public street: string;
    public city: string;
    public state: string;
    public lat: number;
    public lng: number;

    public toString(): string {
        return `\'${this.id}\', ${this.rating}, \'${this.name}\', \'${this.site}\', \'${this.email}\', \'${this.phone}\', \'${this.street}\', \'${this.city}\', \'${this.state}\', ${this.lat}, ${this.lng}`;
    }
}

export class RestaurantDB {
    public ID_RESTAURANT: string;
    public NU_RATING: number;
    public DS_NAME: string;
    public DS_SITE: string;
    public DS_EMAIL: string;
    public DS_PHONE: string;
    public DS_STREET: string;
    public DS_CITY: string;
    public DS_STATE: string;
    public FL_LAT: number;
    public FL_LNG: number;
    public DT_LAST_MODIFICATION: Date;
    public ID_LAST_USER_MODIFIER: number;
    public FG_ACTIVE: boolean;
}