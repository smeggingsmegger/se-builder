/*
* Copyright 2012 Sauce Labs
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

package com.sebuilder.interpreter;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * A Selenium 2 script.
 * @author zarkonnen
 */
public class Script {
	ArrayList<Step> steps = new ArrayList<Step>();
	
	public TestRun start() { return new TestRun(this); }
	public boolean run() { return start().finish(); }
	
	public static class Step {
		public Step(StepType type) {
			this.type = type;
		}
		
		StepType type;
		HashMap<String, String> stringParams = new HashMap<String, String>();
		HashMap<String, Locator> locatorParams = new HashMap<String, Locator>();
	}
}