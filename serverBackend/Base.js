class Base 
{
	constructor(repository) {
		if (!repository) {
			throw new Error('A repository is required');
		}

		this.repository = repository;
	}

	async create(data) {
		if (!data || typeof data !== 'object') {
			throw new TypeError('data must be an object');
		}

		return this.repository.create(data);
	}

	async findAll() {
		return this.repository.findAll();
	}

	async findById(id) {
		return this.repository.findById(id);
	}

	async update(id, data) {
		return this.repository.update(id, data);
	}

	async delete(id) {
		return this.repository.delete(id);
	}
}

module.exports = Base;



