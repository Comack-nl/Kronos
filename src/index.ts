#! /usr/bin/env node

import { Command, OptionValues } from "commander";
import jsonfile from "jsonfile";

import clear from "clear";
import path, { ParsedPath, PlatformPath } from "path";
import HarvestConverter from "./platforms/harvest/HarvestConverter";
import Options from "./Options";
import { Option, OptionsConfig } from "./types";
import AbstractConverter from "./AbstractConverter";

clear();

class Kronos {
	private readonly program: Command;
	private converter: AbstractConverter;

	private defaultOptions: Option[] = [
		{
			field: "dry",
			description: "Whether to only output the results but not write them to a file",
			required: false,
		},
		{
			field: "delimiter",
			description: "The delimiter to use",
			required: false,
			alias: "d",
			defaultValue: ",",
		},
		{
			field: "output_dir <directory>",
			description: "The output directory",
			required: false,
			alias: "o",
			defaultValue: "",
		},
	];

	private options: Options;
	private readonly config: any;
	private originalFile?: ParsedPath;

	constructor() {
		const program = new Command();

		program.version( "1.0.0" )
			.description( "Parses Harvest CSV exports to Toggl import files" )
			.argument( "<file>", "The export file to parse" );

		this.program = program;
		this.options = new Options( this.program );
		this.config = this.loadConfiguration( "harvest" );
		this.registerOptions();

		this.converter = new HarvestConverter( this.config, this.program.opts() );

		this.program.action( this.run.bind( this ) );
	}

	loadConfiguration( platform: string ) {
		return jsonfile.readFileSync( path.resolve( __dirname, `../src/platforms/${ platform }/${ platform }.json` ) );
	}

	registerOptions(): void {
		const options = [ ...this.defaultOptions, ...Object.values( this.config.additionalColumns ) ] as OptionsConfig[];

		this.options.addOptions( options );
	}

	async init() {
		if ( !process.argv.slice( 2 ).length ) {
			this.program.outputHelp();
		}

		await this.program.parseAsync( process.argv );
	}

	generateOutputFileName( outputDir: string ): string {
		if ( !this.originalFile ) {
			return path.resolve( outputDir, "output.csv" );
		}

		return path.resolve( outputDir, `${ this.originalFile.name }-converted${ this.originalFile.ext }` );
	}

	async run( file: string, options: OptionValues, command: Command ) {
		this.originalFile = path.parse( file );
		const results = await this.converter.parse( file );

		if ( !results ) {
			console.error( "No records found" );

			return;
		}

		if ( "dry" in options ) {
			console.log( results );

			return;
		}

		const outputDir = options[ "output_dir" ] ?? `${__dirname}../`;
		const outputFile = this.generateOutputFileName( outputDir );

		this.converter.write( outputFile, results );
		console.log( "CSV file outputted" );
	}
}

( new Kronos() ).init();
