import { OptionConfig, OptionsConfig } from "./types";
import { Command } from "commander";

export default class Options {
	private program: Command;

	constructor( program: Command ) {
		this.program = program;
	}

	addOption( option: OptionConfig ) {
		const { field, description, required, alias = "", defaultValue, type } = option;
		let flag = alias ? `-${ alias }, --${ field }` : `--${ field }`;

		if ( type === "text" ) {
			flag += required ? ` <${field}>` : ` [${field}]`
		}

		required ? this.program.requiredOption( flag, description, defaultValue ) : this.program.option( flag, description, defaultValue );
	}

	addOptions( options: OptionsConfig[] ) {
		for ( const option of options ) {
			this.addOption( option );
		}
	}
}
