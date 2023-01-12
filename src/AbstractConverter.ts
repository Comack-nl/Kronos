import path from "path";
import fs from "fs";
import { Columns, Option, OptionConfig, Record } from "./types";
import { parse, CastingContext } from "csv-parse";
import { OptionValues } from "commander";
import { stringify } from "csv-stringify";

export default abstract class AbstractConverter {
	protected options: OptionValues = {};

	protected columnMappings: Columns = {};
	protected additionalOptions: Option[] = [];
	protected config: any;

	protected constructor( config: object, options: OptionValues ) {
		this.config = config;
		this.options = options;
	}

	async parse( file: string ) {
		try {
			if ( path.extname( file ) !== ".csv" ) {
				console.error( "Only files with the .csv extension are supported" );
			}

			const records = [];
			const parser = fs
				.createReadStream( `${ file }` )
				.pipe( parse( {
					delimiter: this.options.delimiter ?? ",",
					relax_quotes: true,
					relax_column_count: true,
					columns: this.columns.bind( this ),
					cast: this.cast.bind( this ),
					on_record: this.alterRow.bind( this ),
				} ) );

			for await ( const record of parser ) {
				records.push( record );
			}

			return records;
		} catch ( e ) {
			console.error( e );
		}
	}

	write( filename: string, content: string[] ) {
		const stringifier = stringify( content, { header: true } );
		const writableStream = fs.createWriteStream( filename );

		stringifier.pipe(writableStream);
	}

	columns( header: string[] ) {
		return [ ...header, ...Object.keys( this.config.additionalColumns ) ];
	}

	cast( value: string, context: CastingContext ) {
		if ( context.header ) {
			return this.convertHeader( value );
		}

		return this.convertValue( value, context );
	}

	convertHeader( header: string ) {
		return this.config.mappings[ header ] ?? false;
	}

	convertValue( value: string, context: CastingContext ) {
		return value;
	}

	alterRow( record: Record, context: CastingContext ): Record {
		for ( const additional of Object.values( this.config.additionalColumns ) as OptionConfig[] ) {
			if ( this.options[ additional.field ] !== undefined ) {

				const key = this.capitalize( additional.field ) as any;

				record[ key ] = this.options[ additional.field ];
			}
		}

		return record;
	}

	capitalize( text: string ): string {
		return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
	}
}
