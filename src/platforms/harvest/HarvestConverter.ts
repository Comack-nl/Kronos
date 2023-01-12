import AbstractConverter from "./../../AbstractConverter";
import { Record } from "./../../types";
import { CastingContext } from "csv-parse/lib";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { OptionValues } from "commander";

export default class HarvestConverter extends AbstractConverter {

	protected previousRow: Record = {};

	constructor( config: object, options: OptionValues ) {
		dayjs.extend( duration );
		dayjs.extend( customParseFormat );

		super( config, options );
	}

	convertValue( value: string, context: CastingContext ) {
		if ( context.column === "Duration" ) {
			const numberValue = Number( value.replace( ",", "." ) );
			return dayjs.duration( numberValue, "hours" ).format( "HH:mm:ss" );
		}

		if ( this.options.client && context.column === "Client" ) {
			return this.options.client;
		}

		if ( this.options.project && context.column === "Project" ) {
			return this.options.project;
		}

		return value;
	}

	alterRow( record: Record, context: CastingContext ): Record {
		record = super.alterRow( record, context );

		if ( Object.keys( this.previousRow ).length !== 0 && record[ "Start date"] === this.previousRow[ "Start date" ] ) {
			const parsedStart = dayjs( this.previousRow[ "Start" ], "HH:mm:ss" );
			const parsed = dayjs( this.previousRow[ "Duration" ], "HH:mm:ss" );

			const newTime = parsedStart.add(
				dayjs.duration( {
					hours: parsed.get( "hour" ),
					minutes: parsed.get( "minute" ),
					seconds: parsed.get( "second" )
				} )
			);

			record[ "Start" ] = newTime.format( "HH:mm:ss" );
		}

		this.previousRow = record;

		return record;
	}
}
